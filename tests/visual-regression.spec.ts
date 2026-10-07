import { createE2EFixture, expect, loginAsOwner, test } from "./support/e2e-fixtures";

test("odontograma visual mantém a composição principal estável", async ({ page }, testInfo) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  await page.goto(`/patients/${fixture.patientId}`);
  await page.getByRole("tab", { name: "Tratamentos" }).click();
  await page.getByRole("tab", { name: "Atendimento e histórico" }).click();

  const heading = page.getByRole("heading", { name: "Odontograma visual" });
  await expect(heading).toBeVisible();
  const odontogramMap = page.getByRole("listbox", { name: "Odontogram" });
  await expect(odontogramMap).toBeVisible();
  await expect(odontogramMap).toHaveScreenshot("odontogram-map.png", {
    animations: "disabled",
    caret: "hide",
    // The SVG antialiasing differs by a few pixels between local Linux and the GitHub runner.
    // The tablet capture differs by 470 SVG antialiasing pixels (0.34% of its fixed-size map).
    // Other viewports retain the original 400-pixel allowance.
    maxDiffPixels: testInfo.project.name === "tablet" ? 500 : 400,
  });
});
