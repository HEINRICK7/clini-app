import { createE2EFixture, expect, loginAsOwner, test } from "./support/e2e-fixtures";

test("odontograma visual mantém a composição principal estável", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  await page.goto(`/patients/${fixture.patientId}`);
  await page.getByRole("tab", { name: "Tratamentos" }).click();

  const heading = page.getByRole("heading", { name: "Odontograma visual" });
  await expect(heading).toBeVisible();
  const odontogramCard = heading.locator("xpath=..");
  await expect(odontogramCard).toHaveScreenshot("odontogram-card.png", {
    animations: "disabled",
    caret: "hide",
  });
});
