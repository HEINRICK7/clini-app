import { createE2EFixture, expect, loginAsOwner, test } from "./support/e2e-fixtures";

test("odontograma mantém o paciente ao abrir tratamentos pelo dente", async ({ page }) => {
  await loginAsOwner(page);

  const fixture = await createE2EFixture(page);

  await page.goto(`/patients/${fixture.patientId}`);
  await expect(page).toHaveURL(/\/patients\/[0-9a-f-]+$/);
  const patientId = fixture.patientId;

  await page.getByRole("tab", { name: "Tratamentos" }).click();
  await expect(page.getByRole("heading", { name: "Odontograma visual" })).toBeVisible();
  const tooth = page.locator('[role="option"][aria-label^="Dente "]').first();
  await expect(tooth).toBeVisible();
  await tooth.click();
  await expect(page.getByRole("complementary", { name: /Detalhes do dente/ })).toBeVisible();
  await page.getByRole("link", { name: "Abrir tratamentos" }).click();

  await expect(page).toHaveURL(new RegExp(`/more\\?section=treatments&patientId=${patientId}`));
  await expect(page.getByRole("heading", { name: "Tratamentos e procedimentos" })).toBeVisible();
  await expect(page.getByLabel("Paciente")).toHaveValue(patientId!);
  await expect(page.getByText("Paciente selecionado")).toBeVisible();
});
