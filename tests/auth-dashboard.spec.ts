import { expect, test } from "@playwright/test";

test("OWNER entra pela interface e chega ao dashboard do dentista", async ({ page }) => {
  const email = process.env.CLINI_E2E_EMAIL;
  const password = process.env.CLINI_E2E_PASSWORD;
  test.skip(!email || !password, "Defina CLINI_E2E_EMAIL e CLINI_E2E_PASSWORD para executar o fluxo autenticado.");

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Bem-vinda de volta" })).toBeVisible();
  await page.getByLabel("Email").fill(email!);
  await page.getByRole("textbox", { name: "Senha" }).fill(password!);

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
  await expect(page.getByText("Retornos pendentes")).toBeVisible();
  await expect(page.getByRole("img", { name: /avatar/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Agenda", exact: true })).toBeVisible();
});
