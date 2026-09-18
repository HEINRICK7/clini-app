import { expect, test as base, type Page } from "@playwright/test";

type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export type ApiResult<T> = { status: number; body: T };
export type E2EFixture = { unitId: string; patientId: string; procedureId: string; patientName: string };
const expectedServerErrorPatterns = new WeakMap<Page, RegExp[]>();
const expectedConsoleErrorPatterns = new WeakMap<Page, RegExp[]>();

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const serverErrors: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error" && !(expectedConsoleErrorPatterns.get(page) ?? []).some((pattern) => pattern.test(message.text()))) {
        consoleErrors.push(message.text());
      }
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 500 && !(expectedServerErrorPatterns.get(page) ?? []).some((pattern) => pattern.test(response.url()))) {
        serverErrors.push(`${response.status()} ${response.url()}`);
      }
    });

    // Playwright fixture callbacks expose a function named `use`; it is not a React hook.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);

    const diagnostics = { consoleErrors, pageErrors, serverErrors };
    if (consoleErrors.length || pageErrors.length || serverErrors.length) {
      await testInfo.attach("browser-diagnostics.json", {
        body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
        contentType: "application/json",
      });
    }
    if (testInfo.status === "passed" && (consoleErrors.length || pageErrors.length || serverErrors.length)) {
      throw new Error(`Falhas inesperadas no navegador: ${JSON.stringify(diagnostics)}`);
    }
  },
});

export { expect };

export function allowExpectedServerError(page: Page, pattern: RegExp) {
  expectedServerErrorPatterns.set(page, [...(expectedServerErrorPatterns.get(page) ?? []), pattern]);
}

export function allowExpectedConsoleError(page: Page, pattern: RegExp) {
  expectedConsoleErrorPatterns.set(page, [...(expectedConsoleErrorPatterns.get(page) ?? []), pattern]);
}

export async function loginAsOwner(page: Page) {
  const email = process.env.CLINI_E2E_EMAIL;
  const password = process.env.CLINI_E2E_PASSWORD;
  if (!email || !password) {
    throw new Error("CLINI_E2E_EMAIL e CLINI_E2E_PASSWORD são obrigatórios para os testes E2E reais.");
  }

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Bem-vinda de volta" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Senha" }).fill(password);
  await Promise.all([
    page.waitForURL((url) => url.pathname === "/" || url.pathname === "/select-unit"),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
  if (new URL(page.url()).pathname === "/select-unit") {
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/"),
      page.getByRole("button", { name: "Continuar" }).click(),
    ]);
  }
}

export async function api<T>(page: Page, path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  return page.evaluate(async ({ path, method = "GET", body, headers = {} }) => {
    const csrf = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())
      ? await fetch("/api/v1/auth/csrf", { credentials: "include" }).then(async (response) => {
        if (!response.ok) throw new Error(`CSRF falhou com ${response.status}`);
        return (await response.json() as { token: string }).token;
      })
      : undefined;
    const response = await fetch(`/api/v1${path}`, {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
    return { status: response.status, body: parsed };
  }, { path, ...options }) as Promise<ApiResult<T>>;
}

export function expectStatus<T>(result: ApiResult<T>, expected: number): T {
  expect(result.status, JSON.stringify(result.body)).toBe(expected);
  return result.body;
}

export async function createE2EFixture(page: Page): Promise<E2EFixture> {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const unit = expectStatus(await api<{ id: string }>(page, "/units", {
    method: "POST",
    body: { name: `E2E Unit ${suffix}`, city: "Fortaleza" },
  }), 201);
  const patientName = `E2E Paciente ${suffix}`;
  const patient = expectStatus(await api<{ id: string }>(page, "/patients", {
    method: "POST",
    body: { currentUnitId: unit.id, fullName: patientName, email: `e2e-${suffix}@example.com` },
  }), 201);
  const procedure = expectStatus(await api<{ id: string }>(page, "/catalog/procedures", {
    method: "POST",
    body: { name: `E2E Procedimento ${suffix}`, description: "Procedimento criado apenas para teste automatizado." },
  }), 201);
  expectStatus(await api(page, `/catalog/procedures/${procedure.id}/units/${unit.id}`, {
    method: "PUT",
    body: { priceCents: 10000, durationMinutes: 30 },
  }), 200);
  return { unitId: unit.id, patientId: patient.id, procedureId: procedure.id, patientName };
}

export async function assertNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.documentWidth, `scroll horizontal: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}
