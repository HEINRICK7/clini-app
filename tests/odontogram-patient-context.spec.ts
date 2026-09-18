import { expect, test } from "@playwright/test";

test("odontograma mantém o paciente ao abrir tratamentos pelo dente", async ({ page }) => {
  const email = process.env.CLINI_E2E_EMAIL;
  const password = process.env.CLINI_E2E_PASSWORD;
  test.skip(!email || !password, "Defina CLINI_E2E_EMAIL e CLINI_E2E_PASSWORD para executar o fluxo autenticado.");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByRole("textbox", { name: "Senha" }).fill(password!);
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

  const units = await page.evaluate(async () => {
    const response = await fetch("/api/v1/units", { credentials: "include" });
    return { status: response.status, body: await response.json() as Array<{ id: string }> };
  });
  expect(units.status).toBe(200);
  let unitId = units.body[0]?.id;
  if (!units.body.length) {
    const csrf = await page.evaluate(async () => {
      const response = await fetch("/api/v1/auth/csrf", { credentials: "include" });
      return (await response.json() as { token: string }).token;
    });
    const unit = await page.evaluate(async (token) => {
      const response = await fetch("/api/v1/units", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": token },
        body: JSON.stringify({ name: `E2E ${Date.now()}` }),
      });
      return { status: response.status, body: await response.json() as { id?: string } };
    }, csrf);
    expect(unit.status).toBe(201);
    expect(unit.body.id).toBeTruthy();
    unitId = unit.body.id!;
  }
  const patientName = `Paciente E2E ${Date.now()}`;
  expect(unitId).toBeTruthy();
  const csrf = await page.evaluate(async () => {
    const response = await fetch("/api/v1/auth/csrf", { credentials: "include" });
    return (await response.json() as { token: string }).token;
  });
  const patient = await page.evaluate(async ({ token, currentUnitId, fullName }) => {
    const response = await fetch("/api/v1/patients", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": token },
      body: JSON.stringify({ currentUnitId, fullName }),
    });
    return { status: response.status, body: await response.json() as { id?: string } };
  }, { token: csrf, currentUnitId: unitId!, fullName: patientName });
  expect(patient.status).toBe(201);
  expect(patient.body.id).toBeTruthy();

  await page.goto(`/patients/${patient.body.id}`);
  await expect(page).toHaveURL(/\/patients\/[0-9a-f-]+$/);
  const patientId = new URL(page.url()).pathname.split("/").pop();
  expect(patientId).toBeTruthy();

  await page.getByRole("tab", { name: "Tratamentos" }).click();
  await expect(page.getByRole("heading", { name: "Odontograma visual" })).toBeVisible();
  const tooth = page.locator('[role="option"][aria-label^="Tooth "]').first();
  await expect(tooth).toBeVisible();
  await tooth.click();
  await expect(page.getByRole("complementary", { name: /Detalhes do dente/ })).toBeVisible();
  await page.getByRole("link", { name: "Abrir tratamentos" }).click();

  await expect(page).toHaveURL(new RegExp(`/more\\?section=treatments&patientId=${patientId}`));
  await expect(page.getByRole("heading", { name: "Tratamentos e procedimentos" })).toBeVisible();
  await expect(page.getByLabel("Paciente")).toHaveValue(patientId!);
  await expect(page.getByText("Paciente selecionado")).toBeVisible();
});
