import { api, assertNoHorizontalOverflow, createE2EFixture, expect, expectStatus, loginAsOwner, test } from "./support/e2e-fixtures";

test("GF-04 novo paciente: cadastro feito pela interface aparece na lista", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const patientName = `Paciente criado pela UI ${Date.now()}`;

  await page.goto("/patients");
  await page.getByRole("button", { name: "Adicionar paciente" }).click();
  await page.getByLabel("Unit atual *").selectOption(fixture.unitId);
  await page.getByLabel("Nome completo").fill(patientName);
  await page.getByRole("button", { name: "Cadastrar paciente" }).click();

  await expect(page.getByText("Paciente cadastrado com sucesso.")).toBeVisible();
  await expect(page.getByRole("heading", { name: patientName })).toBeVisible();
});

test("GF-05 agenda: cria atendimento e o exibe no período selecionado", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);

  await page.goto(`/agenda?patientId=${fixture.patientId}`);
  await expect(page.getByRole("heading", { name: "Adicionar à agenda" })).toBeVisible();
  await page.getByLabel("Local de atendimento").selectOption(fixture.unitId);
  await page.getByLabel("Paciente").selectOption(fixture.patientId);
  await page.getByRole("textbox", { name: "Início", exact: true }).fill("09:00");
  await page.getByRole("textbox", { name: "Fim", exact: true }).fill("10:00");
  await page.getByRole("button", { name: "Criar atendimento" }).click();

  await expect(page.getByText("Atendimento criado.")).toBeVisible();
  await expect(page.getByText("Atendimento agendado")).toBeVisible();
});

test("GF-03 odontograma: registra procedimento no dente 16 e confirma o histórico", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);

  await page.goto(`/appointments/start?patientId=${fixture.patientId}`);
  await expect(page.getByText(fixture.patientName)).toBeVisible();
  await page.getByLabel("Motivo e contexto").fill("Avaliação automatizada do dente 16.");
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Procedimentos").first()).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { name: "Odontograma visual" })).toBeVisible();
  await page.locator('[role="option"][aria-label="Dente 16"]').click();
  await page.getByRole("button", { name: "+ Procedimento" }).first().click();
  await page.getByLabel("Procedimento realizado").selectOption(fixture.procedureId);
  await page.getByRole("button", { name: "Salvar procedimento" }).click();

  await expect(page.locator('[aria-live="polite"]')).toContainText(/Registro salvo no dente 16/, { timeout: 10000 });
  await expect(page.getByText("Procedimento", { exact: true }).last()).toBeVisible();
  const history = expectStatus(await api<Array<{ type: string; toothId: string }>>(page, `/patients/${fixture.patientId}/teeth/16/history`), 200);
  expect(history.some((record) => record.type === "PROCEDURE" && record.toothId === "16")).toBe(true);
});

test("GF-06 tratamento: cria plano, adiciona procedimento e mantém o paciente no contexto", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const treatmentName = `Plano E2E ${Date.now()}`;

  await page.goto(`/more?section=treatments&patientId=${fixture.patientId}`);
  await expect(page.getByLabel("Paciente")).toHaveValue(fixture.patientId);
  await page.getByLabel("Nome do tratamento").fill(treatmentName);
  await page.getByRole("button", { name: "Criar tratamento" }).click();
  await expect(page.getByText("Tratamento criado como planejado.")).toBeVisible();
  await expect(page.getByRole("heading", { name: treatmentName })).toBeVisible();

  await page.getByRole("button", { name: new RegExp(treatmentName) }).click();
  await expect(page.getByLabel("Procedimento do catálogo (opcional)")).toBeEnabled();
  await page.getByLabel("Procedimento do catálogo (opcional)").selectOption(fixture.procedureId);
  await page.getByRole("button", { name: "Adicionar planejado" }).click();
  await expect(page.getByText("Procedimento planejado adicionado.")).toBeVisible();
  await expect(page.locator("option").filter({ hasText: "E2E Procedimento" }).first()).toBeAttached();
  await assertNoHorizontalOverflow(page);
});
