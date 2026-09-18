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
