import { api, assertNoHorizontalOverflow, createE2EFixture, expect, expectStatus, loginAsOwner, test } from "./support/e2e-fixtures";

test("odontograma avançado salva achados por superfície no prontuário e restaura após recarregar", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const route = `/more?section=odontogram&patientId=${fixture.patientId}`;
  await page.goto(route);
  await expect(page.getByTestId("advanced-clinical-odontogram")).toBeVisible();

  const tooth16 = page.locator('[role="option"][aria-label*="16"]').first();
  await expect(tooth16).toBeVisible();
  await tooth16.click();
  const occlusalSurface = page.getByRole("checkbox", { name: /oclusal/i }).first();
  await expect(occlusalSurface).toBeVisible();
  await occlusalSurface.check();
  await expect(page.getByTestId("save-advanced-odontogram")).toBeEnabled();

  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await assertNoHorizontalOverflow(page);
  }

  await page.getByTestId("save-advanced-odontogram").click();
  await expect(page.getByTestId("odontogram-save-state")).toHaveText("Tudo salvo");
  const firstSave = expectStatus(await api<{
    version: number;
    chartPayload: { format: string; statusChart: { teeth: Record<string, unknown> } };
  }>(page, `/clinical/odontograms?patientId=${fixture.patientId}`), 200);
  expect(firstSave.version).toBe(1);
  expect(firstSave.chartPayload.format).toBe("clini-advanced-odontogram");
  expect(firstSave.chartPayload.statusChart.teeth["16"]).toBeTruthy();

  await page.reload();
  await expect(page.getByTestId("advanced-clinical-odontogram")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /oclusal/i }).first()).toBeChecked();
  const afterReload = expectStatus(await api<typeof firstSave>(page, `/clinical/odontograms?patientId=${fixture.patientId}`), 200);
  expect(afterReload.chartPayload).toEqual(firstSave.chartPayload);
});
