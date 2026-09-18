import { expect, loginAsOwner, test } from "./support/e2e-fixtures";

test("OWNER entra pela interface e chega ao dashboard do dentista", async ({ page }) => {
  await loginAsOwner(page);

  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await expect(page.getByText("Sua agenda")).toBeVisible();
  await expect(page.getByText("Retornos pendentes")).toBeVisible();
  await expect(page.getByRole("img", { name: /avatar/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
});
