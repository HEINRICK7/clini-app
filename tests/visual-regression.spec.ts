import { createE2EFixture, expect, loginAsOwner, test } from "./support/e2e-fixtures";

test("odontograma visual mantém a composição principal estável", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  await page.goto(`/patients/${fixture.patientId}`);
  await page.getByRole("tab", { name: "Tratamentos" }).click();

  const heading = page.getByRole("heading", { name: "Odontograma visual" });
  await expect(heading).toBeVisible();
  const odontogramMap = page.getByRole("listbox", { name: "Odontogram" });
  await expect(odontogramMap).toBeVisible();
  await expect(odontogramMap).toHaveScreenshot("odontogram-map.png", {
    animations: "disabled",
    caret: "hide",
    // The SVG antialiasing differs by a few pixels between local Linux and the GitHub runner.
    // Keep the allowance below 0.5% of the smallest viewport capture; size and layout remain exact.
    maxDiffPixels: 400,
  });
});
