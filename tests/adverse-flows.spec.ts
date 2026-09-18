import { allowExpectedConsoleError, allowExpectedServerError, api, createE2EFixture, expect, expectStatus, loginAsOwner, test } from "./support/e2e-fixtures";

test("odontograma: submissão repetida com a mesma operação não duplica o registro", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const key = `e2e-idempotency-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const body = { unitId: fixture.unitId, toothIds: ["16"], procedureId: fixture.procedureId, description: "Registro idempotente" };

  const [first, second] = await Promise.all([
    api<Array<{ id: string }>>(page, `/patients/${fixture.patientId}/tooth-procedures`, { method: "POST", body, headers: { "Idempotency-Key": key } }),
    api<Array<{ id: string }>>(page, `/patients/${fixture.patientId}/tooth-procedures`, { method: "POST", body, headers: { "Idempotency-Key": key } }),
  ]);
  expectStatus(first, 201);
  expectStatus(second, 201);
  expect(first.body[0]?.id).toBe(second.body[0]?.id);

  const history = expectStatus(await api<Array<{ type: string; id: string }>>(page, `/patients/${fixture.patientId}/teeth/16/history`), 200);
  expect(history.filter((record) => record.id === first.body[0]?.id)).toHaveLength(1);
});

test("falha de rede no carregamento não deixa tela branca e oferece estado de erro", async ({ page }) => {
  await loginAsOwner(page);
  allowExpectedConsoleError(page, /net::ERR_FAILED/);
  await page.route("**/api/v1/patients*", (route) => route.abort("failed"));
  await page.goto("/patients");
  await expect(page.getByText("Não foi possível carregar os pacientes.")).toBeVisible();
});

test("resposta 500 da API é observável e a tela mantém uma mensagem compreensível", async ({ page }) => {
  await loginAsOwner(page);
  allowExpectedServerError(page, /\/api\/v1\/patients/);
  allowExpectedConsoleError(page, /status of 500/);
  await page.route("**/api/v1/patients*", (route) => route.fulfill({
    status: 500,
    contentType: "application/problem+json",
    body: JSON.stringify({ title: "Erro controlado", detail: "Falha simulada para validar a recuperação da interface." }),
  }));
  await page.goto("/patients");
  await expect(page.getByText("Não foi possível carregar os pacientes.")).toBeVisible();
});

test("logout invalida a sessão e voltar não restaura uma tela protegida", async ({ page }) => {
  await loginAsOwner(page);
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
});
