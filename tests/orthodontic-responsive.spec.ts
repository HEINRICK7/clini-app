import { api, assertNoHorizontalOverflow, createE2EFixture, expect, expectStatus, loginAsOwner, test } from "./support/e2e-fixtures";

test("arcada ortodôntica persiste o aparelho e cabe em telas móveis e tablet", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const suffix = `${Date.now()}`;
  const treatmentName = `E2E Ortodontia responsiva ${suffix}`;

  await page.goto(`/more?section=treatments&patientId=${fixture.patientId}`);
  await expect(page.getByRole("heading", { name: "Tratamentos e procedimentos" })).toBeVisible();
  await page.getByLabel("Tipo de tratamento").selectOption("ORTHODONTIC");
  await page.getByLabel("Tipo de aparelho").selectOption("FIXED");
  await page.getByLabel("Nome do tratamento").fill(treatmentName);
  await page.getByRole("button", { name: "Criar tratamento" }).click();

  const wire = page.getByTestId("orthodontic-wire");
  await expect(wire).toBeVisible();
  await expect(page.locator(".tooth-tile.side-view[data-tooth]")).toHaveCount(32);

  const treatments = expectStatus(await api<{ items: Array<{ name: string; category?: string; applianceType?: string | null }> }>(
    page,
    `/clinical/treatments?patientId=${fixture.patientId}&size=20`,
  ), 200);
  expect(treatments.items).toContainEqual(expect.objectContaining({ name: treatmentName, category: "ORTHODONTIC", applianceType: "FIXED" }));

  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await assertNoHorizontalOverflow(page);
    const chart = await page.locator("[data-orthodontic-odontogram]").boundingBox();
    const overlay = await wire.boundingBox();
    expect(chart?.width).toBeLessThanOrEqual(width);
    expect(overlay?.width).toBeCloseTo(chart?.width ?? 0, 0);
  }
});
