import { allowExpectedConsoleError, api, createE2EFixture, expect, loginAsOwner, test } from "./support/e2e-fixtures";

const routes = [
  "/",
  "/agenda",
  "/patients",
  "/more",
  "/more?section=units",
  "/more?section=records",
  "/more?section=odontogram",
  "/more?section=documents",
  "/more?section=prescriptions",
  "/more?section=attachments",
  "/more?section=catalog",
  "/more?section=finance",
  "/more?section=budgets",
  "/more?section=privacy",
  "/more?section=notifications",
  "/more?section=audit",
  "/more?section=settings",
];

test("crawler percorre as rotas operacionais sem tela quebrada ou links internos inválidos", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
    await expect(page.locator("body")).not.toContainText("Unhandled Runtime Error");
    await expect(page.locator("body")).not.toContainText("Cannot read properties");
    const internalLinks = await page.locator('a[href^="/"]').evaluateAll((links) => links.map((link) => (link as HTMLAnchorElement).getAttribute("href")).filter((href): href is string => Boolean(href)));
    expect(internalLinks.every((href) => !href.startsWith("/undefined") && !href.includes("[object Object]")), `${route} gerou link inválido`).toBe(true);
  }

  await page.goto(`/patients/${fixture.patientId}`);
  await expect(page.getByRole("heading", { name: fixture.patientName })).toBeVisible();
  await page.goto(`/more?section=treatments&patientId=${fixture.patientId}`);
  await expect(page.getByLabel("Paciente")).toHaveValue(fixture.patientId);

  const protectedResponse = await api(page, "/auth/me");
  expect(protectedResponse.status).toBe(200);
});

test("crawler preserva 404 para uma rota inexistente sem erro 5xx", async ({ page }) => {
  await loginAsOwner(page);
  allowExpectedConsoleError(page, /status of 404/);
  const response = await page.goto("/rota-que-nao-existe-no-clini");
  expect(response?.status()).toBe(404);
  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("Application error");
});
