import { expect, test } from "@playwright/test";

test("OWNER entra pela interface e chega ao dashboard do dentista", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Bem-vinda de volta" })).toBeVisible();
  await page.keyboard.press("Alt+t");
  await expect(page.getByLabel("Email")).toHaveValue("teste@clini.local");
  await expect(page.getByRole("textbox", { name: "Senha" })).toHaveValue("CliniTeste@2026!");

  await Promise.all([
    page.waitForURL((url) => url.pathname === "/" || url.pathname === "/select-unit"),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
  if (new URL(page.url()).pathname === "/select-unit") {
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/"),
      page.getByRole("button", { name: "Continuar" }).click(),
    ]);
  }

  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await expect(page.getByText("Sua agenda")).toBeVisible();
  await expect(page.getByLabel(/dentista proprietário/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
});
