import { assertNoHorizontalOverflow, createE2EFixture, expect, loginAsOwner, test } from "./support/e2e-fixtures";

test("layout responsivo: ações principais e odontograma cabem no viewport", async ({ page }, testInfo) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);

  await page.goto(`/patients/${fixture.patientId}`);
  await page.getByRole("tab", { name: "Tratamentos" }).click();
  await expect(page.getByRole("heading", { name: "Odontograma visual" })).toBeVisible();
  await assertNoHorizontalOverflow(page);

  const viewport = testInfo.project.use.viewport;
  if (viewport && viewport.width <= 430) {
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Odontograma visual" })).toBeInViewport();
  }

  if (testInfo.project.name === "mobile-375") {
    await page.setViewportSize({ width: 320, height: 740 });
    await assertNoHorizontalOverflow(page);
    await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Odontograma visual" })).toBeInViewport();
  }
});

test("lista de pacientes longa não cria corte horizontal em tela estreita", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-375", "Reprodução do viewport estreito fica isolada no projeto mobile.");
  await page.setViewportSize({ width: 203, height: 522 });
  const tenantId = "00000000-0000-4000-8000-000000000001";
  const unitId = "00000000-0000-4000-8000-000000000002";
  const secondaryUnitId = "00000000-0000-4000-8000-000000000004";
  const patientId = "00000000-0000-4000-8000-000000000003";
  const patientName = "Paciente TESTE HOMOLOG 20261006";
  const units = [
    { id: unitId, tenantId, name: "Consultório Centro", city: null, address: null, phone: null, whatsapp: null, primary: true, status: "ACTIVE", timezone: "America/Fortaleza" },
    { id: secondaryUnitId, tenantId, name: "Consultório Aldeota", city: null, address: null, phone: null, whatsapp: null, primary: false, status: "ACTIVE", timezone: "America/Fortaleza" },
  ];
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/v1", "");
    if (path === "/auth/me") {
      await route.fulfill({ json: { userId: tenantId, email: "dentista@example.test", name: "Carlos Henrique", role: "OWNER", tenantId, units: units.map(({ id, name, status, primary, timezone }) => ({ id, name, status, primary, timezone })), capabilities: [] } });
      return;
    }
    if (path === "/units") {
      await route.fulfill({ json: units });
      return;
    }
    if (path.startsWith("/patients")) {
      await route.fulfill({ json: { items: [{ id: patientId, tenantId, currentUnitId: unitId, fullName: patientName, dateOfBirth: null, cpf: null, phone: "86994209350", email: null, address: null, responsiblePatientId: null, status: "ACTIVE", provisional: true }], page: 0, size: 20, totalItems: 1, totalPages: 1 } });
      return;
    }
    await route.fulfill({ status: 404, json: { message: "Rota não simulada neste teste." } });
  });

  await page.goto("/patients");
  const patientCard = page.locator("article").filter({ hasText: patientName }).first();
  await expect(patientCard).toBeVisible();
  await expect(patientCard.getByRole("heading", { name: patientName })).toBeVisible();
  await expect(patientCard.getByLabel(`Transferir ${patientName}`)).toBeVisible();
  for (const width of [203, 320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await assertNoHorizontalOverflow(page);
    const overflowingTabs = await page.getByRole("tab").evaluateAll((tabs) => tabs.map((tab) => tab.scrollWidth > tab.clientWidth));
    expect(overflowingTabs).toEqual([false, false, false]);

    const cardBounds = await patientCard.boundingBox();
    expect(cardBounds).not.toBeNull();
    expect(cardBounds!.x + cardBounds!.width).toBeLessThanOrEqual(width);
    const transferBounds = await patientCard.getByLabel(`Transferir ${patientName}`).boundingBox();
    expect(transferBounds).not.toBeNull();
    expect(transferBounds!.x + transferBounds!.width).toBeLessThanOrEqual(cardBounds!.x + cardBounds!.width);
  }
  await expect(page.getByRole("tab", { name: "Em atendimento" })).toContainText("Em atendimento");
});

test("odontograma: cada dente possui nome acessível e o painel contextual é identificável", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  await page.goto(`/patients/${fixture.patientId}`);
  await page.getByRole("tab", { name: "Tratamentos" }).click();

  const teeth = page.locator('[role="option"]');
  await expect(teeth).toHaveCount(32);
  const labels = await teeth.evaluateAll((items) => items.map((item) => item.getAttribute("aria-label")));
  expect(labels.every((label) => Boolean(label?.match(/^Dente (1[1-8]|2[1-8]|3[1-8]|4[1-8])$/)))).toBe(true);

  await teeth.first().click();
  await expect(page.getByRole("complementary", { name: /Detalhes do dente/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Fechar detalhes" })).toBeVisible();
});

test("formulários críticos expõem labels e foco visível para teclado", async ({ page }) => {
  await loginAsOwner(page);
  await page.goto("/patients");
  const addPatient = page.getByRole("button", { name: "Adicionar paciente" });
  await expect(addPatient).toBeEnabled();
  await addPatient.scrollIntoViewIfNeeded();
  await addPatient.click();

  const unlabeledFields = await page.locator('input:not([type="hidden"]), textarea, select').evaluateAll((fields) => fields
    .filter((field) => {
      const id = field.getAttribute("id");
      return !field.getAttribute("aria-label") && !field.getAttribute("aria-labelledby")
        && !field.closest("label") && !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`));
    })
    .map((field) => field.outerHTML));
  expect(unlabeledFields).toEqual([]);

  const closeButton = page.getByRole("button", { name: "Fechar cadastro de paciente" });
  await closeButton.focus();
  await expect(closeButton).toBeFocused();
  const focusStyle = await closeButton.evaluate((element) => getComputedStyle(element).outlineStyle);
  expect(focusStyle).not.toBe("none");
});
