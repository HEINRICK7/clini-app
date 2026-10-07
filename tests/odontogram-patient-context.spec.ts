import { api, createE2EFixture, expect, expectStatus, loginAsOwner, test } from "./support/e2e-fixtures";

test("odontograma mantém o paciente ao abrir tratamentos pelo dente", async ({ page }) => {
  await loginAsOwner(page);

  const fixture = await createE2EFixture(page);

  await page.goto(`/patients/${fixture.patientId}`);
  await expect(page).toHaveURL(/\/patients\/[0-9a-f-]+$/);
  const patientId = fixture.patientId;

  await page.getByRole("tab", { name: "Tratamentos" }).click();
  const advancedChart = page.getByTestId("advanced-clinical-odontogram");
  await expect(advancedChart).toBeVisible();
  await expect(advancedChart.getByTestId("odontogram-save-state")).toHaveText("Sem alterações");
  await expect(advancedChart.getByTestId("save-advanced-odontogram")).toBeVisible();
  await expect(advancedChart.getByText("Somente leitura")).toHaveCount(0);

  const tooth16 = page.locator('[role="option"][aria-label*="16"]').first();
  await tooth16.click();
  const occlusalSurface = page.locator("#chk-caries-occlusal");
  await page.locator(".clini-advanced-chart-library label.surface-cell.pos-occlusal")
    .filter({ has: occlusalSurface })
    .click();
  const saveOdontogram = page.getByTestId("save-advanced-odontogram");
  await expect(saveOdontogram).toBeEnabled();
  const saveResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/clinical/odontograms"));
  await saveOdontogram.click();
  const saveResponse = await saveResponsePromise;
  expect(saveResponse.status()).toBe(201);
  await expect(advancedChart.getByTestId("odontogram-save-state")).toHaveText("Tudo salvo", { timeout: 15000 });
  const savedChart = expectStatus(await api<{ version: number }>(page, `/clinical/odontograms?patientId=${patientId}`), 200);
  expect(savedChart.version).toBe(1);

  await page.getByRole("tab", { name: "Atendimento e histórico" }).click();
  await expect(page.getByRole("heading", { name: "Odontograma visual" })).toBeVisible({ timeout: 15000 });
  const tooth = page.locator('[role="option"][aria-label^="Dente "]').first();
  await expect(tooth).toBeVisible();
  await tooth.click();
  await expect(page.getByRole("complementary", { name: /Detalhes do dente/ })).toBeVisible();
  await page.getByRole("link", { name: "Abrir tratamentos" }).click();

  await expect(page).toHaveURL(new RegExp(`/more\\?section=treatments&patientId=${patientId}`));
  await expect(page.getByRole("heading", { name: "Tratamentos e procedimentos" })).toBeVisible();
  await expect(page.getByText(fixture.patientName, { exact: true })).toBeVisible();
  await expect(page.getByText("Paciente selecionado")).toBeVisible();
});
