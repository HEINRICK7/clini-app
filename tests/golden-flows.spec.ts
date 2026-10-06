import { api, assertNoHorizontalOverflow, createE2EFixture, expect, expectStatus, loginAsOwner, test } from "./support/e2e-fixtures";

test("GF-01 consultório: cria o local e preserva a unidade principal do dentista", async ({ page }) => {
  await loginAsOwner(page);
  const unitsBefore = expectStatus(await api<Array<{ id: string; name: string; primary: boolean; status: string }>>(page, "/units"), 200);
  const previousPrimary = unitsBefore.find((unit) => unit.primary);
  const unitName = `CONSULTÓRIO TESTE HOMOLOG ${Date.now()}`;

  await page.goto("/more?section=units");
  await page.getByLabel("Nome do consultório").fill(unitName);
  await page.getByLabel("Cidade").fill("Fortaleza");
  await page.getByLabel("Endereço").fill("Endereço sintético de teste");
  await page.getByRole("button", { name: "Adicionar consultório", exact: true }).click();
  await expect(page.getByText("Consultório adicionado com sucesso.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: unitName, exact: true })).toBeVisible();

  let units = expectStatus(await api<Array<{ id: string; name: string; primary: boolean; status: string }>>(page, "/units"), 200);
  const createdUnit = units.find((unit) => unit.name === unitName);
  expect(createdUnit).toMatchObject({ primary: unitsBefore.length === 0, status: "ACTIVE" });
  if (previousPrimary && createdUnit) {
    const newUnitCard = page.locator("article").filter({ has: page.getByRole("heading", { name: unitName, exact: true }) });
    await newUnitCard.getByRole("button", { name: "Definir como principal" }).click();
    units = expectStatus(await api<Array<{ id: string; name: string; primary: boolean; status: string }>>(page, "/units"), 200);
    expect(units.find((unit) => unit.id === createdUnit.id)?.primary).toBe(true);

    const previousCard = page.locator("article").filter({ has: page.getByRole("heading", { name: previousPrimary.name, exact: true }) });
    await previousCard.getByRole("button", { name: "Definir como principal" }).click();
    units = expectStatus(await api<Array<{ id: string; name: string; primary: boolean; status: string }>>(page, "/units"), 200);
    expect(units.find((unit) => unit.id === previousPrimary.id)?.primary).toBe(true);
  }
});

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

test("GF-07 odontograma: mantém o status em andamento do tratamento no dente", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const treatment = expectStatus(await api<{ id: string }>(page, "/clinical/treatments", {
    method: "POST",
    body: { patientId: fixture.patientId, name: `Plano odontograma E2E ${Date.now()}` },
  }), 201);
  expectStatus(await api(page, `/clinical/treatments/${treatment.id}/status`, {
    method: "POST",
    body: { status: "ACTIVE" },
  }), 200);
  const planned = expectStatus(await api<{ id: string }>(page, `/clinical/treatments/${treatment.id}/planned-procedures`, {
    method: "POST",
    body: { name: "Procedimento teste dente 16", expectedUnitId: fixture.unitId, catalogProcedureId: fixture.procedureId },
  }), 201);

  await page.goto(`/appointments/start?patientId=${fixture.patientId}`);
  await page.getByLabel("Motivo e contexto").fill("Avaliação de teste do dente 16.");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByText("Procedimentos", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("heading", { name: "Odontograma visual" }).waitFor();
  await page.locator('[role="option"][aria-label="Dente 16"]').click();
  await page.getByRole("button", { name: "+ Planejamento", exact: true }).click();
  await page.getByLabel("Item do tratamento").selectOption(planned.id);
  await page.getByLabel("Status").selectOption("IN_PROGRESS");
  await page.getByLabel("Descrição (opcional)").fill("Teste automatizado: tratamento em andamento.");
  await page.getByRole("button", { name: "Salvar planejamento", exact: true }).click();
  await expect(page.locator('[aria-live="polite"]').first()).toContainText("Registro salvo no dente 16");

  const history = expectStatus(await api<Array<{ type: string; status: string | null; planItemId: string | null }>>(page, `/patients/${fixture.patientId}/teeth/16/history`), 200);
  expect(history.some((record) => record.type === "PLANNING" && record.status === "IN_PROGRESS" && record.planItemId === planned.id)).toBe(true);
  const odontogram = expectStatus(await api<{ teeth: Array<{ toothId: string; hasOpenPlanning: boolean; hasActiveTreatment: boolean }> }>(page, `/patients/${fixture.patientId}/odontogram`), 200);
  expect(odontogram.teeth.find((tooth) => tooth.toothId === "16")).toMatchObject({ hasOpenPlanning: false, hasActiveTreatment: true });
});

test("GF-08 fluxo do dentista: consultório, paciente, agenda, dente e tratamento concluído", async ({ page }) => {
  await loginAsOwner(page);
  const unitsBefore = expectStatus(await api<Array<{ id: string; name: string; primary: boolean; status: string }>>(page, "/units"), 200);
  const previousPrimary = unitsBefore.find((unit) => unit.primary);
  const suffix = Date.now();
  const unitName = `CONSULTÓRIO TESTE HOMOLOG ${suffix}`;
  const patientName = `PACIENTE TESTE HOMOLOG ${suffix}`;
  const procedureName = `Procedimento TESTE HOMOLOG ${suffix}`;
  const treatmentName = `Tratamento TESTE HOMOLOG ${suffix}`;

  await page.goto("/more?section=units");
  await page.getByLabel("Nome do consultório").fill(unitName);
  await page.getByLabel("Cidade").fill("Fortaleza");
  await page.getByRole("button", { name: "Adicionar consultório", exact: true }).click();
  await expect(page.getByText("Consultório adicionado com sucesso.", { exact: true })).toBeVisible();
  const units = expectStatus(await api<Array<{ id: string; name: string; primary: boolean; status: string }>>(page, "/units"), 200);
  const unit = units.find((item) => item.name === unitName);
  expect(unit).toMatchObject({ primary: unitsBefore.length === 0, status: "ACTIVE" });
  if (previousPrimary) expect(units.find((item) => item.id === previousPrimary.id)?.primary).toBe(true);
  if (!unit) throw new Error("O consultório de teste não apareceu na lista.");

  await page.goto("/patients");
  await page.getByRole("button", { name: "Adicionar paciente" }).click();
  await page.getByLabel("Unit atual *").selectOption(unit.id);
  await page.getByLabel("Nome completo").fill(patientName);
  const patientResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/patients"));
  await page.getByRole("button", { name: "Cadastrar paciente" }).click();
  const patientResponse = await patientResponsePromise;
  expect(patientResponse.status()).toBe(201);
  const patient = await patientResponse.json() as { id: string; currentUnitId: string };
  expect(patient.currentUnitId).toBe(unit.id);
  await expect(page.getByText("Paciente cadastrado com sucesso.", { exact: true })).toBeVisible();

  await page.goto("/more?section=catalog");
  await page.getByLabel("Nome do procedimento").fill(procedureName);
  await page.getByLabel("Descrição (opcional)").fill("Registro sintético para validar o fluxo de homologação.");
  const procedureResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/catalog/procedures"));
  await page.getByRole("button", { name: "Adicionar procedimento", exact: true }).click();
  const procedureResponse = await procedureResponsePromise;
  expect(procedureResponse.status()).toBe(201);
  const procedure = await procedureResponse.json() as { id: string };
  await expect(page.getByText("Procedimento criado.", { exact: true })).toBeVisible();
  await page.getByLabel("Unit").selectOption(unit.id);
  await page.getByLabel("Preço (R$)").fill("100,00");
  await page.getByLabel("Duração (minutos)").fill("30");
  await page.getByRole("button", { name: "Salvar na Unit", exact: true }).click();
  await expect(page.getByText("Configuração da Unit salva.", { exact: true })).toBeVisible();

  await page.goto(`/more?section=treatments&patientId=${patient.id}`);
  await page.getByLabel("Nome do tratamento").fill(treatmentName);
  await page.getByLabel("Notas do planejamento").fill("TESTE HOMOLOG: fluxo sintético de ponta a ponta.");
  const treatmentResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/clinical/treatments"));
  await page.getByRole("button", { name: "Criar tratamento", exact: true }).click();
  const treatmentResponse = await treatmentResponsePromise;
  expect(treatmentResponse.status()).toBe(201);
  const treatment = await treatmentResponse.json() as { id: string };
  await expect(page.getByText("Tratamento criado como planejado.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ativar", exact: true }).click();
  await expect(page.getByText("Status do tratamento atualizado.", { exact: true })).toBeVisible();
  await page.getByLabel("Procedimento do catálogo (opcional)").selectOption(procedure.id);
  await page.getByRole("button", { name: "Adicionar planejado", exact: true }).click();
  await expect(page.getByText("Procedimento planejado adicionado.", { exact: true })).toBeVisible();
  const treatmentPage = expectStatus(await api<{ items: Array<{ id: string; plannedProcedures: Array<{ id: string; name: string }> }> }>(page, `/clinical/treatments?patientId=${patient.id}&size=20`), 200);
  const createdTreatment = treatmentPage.items.find((item) => item.id === treatment.id);
  const planned = createdTreatment?.plannedProcedures[0];
  if (!planned) throw new Error("O procedimento planejado não apareceu no tratamento.");

  const appointmentDate = await page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  });
  await page.goto(`/agenda?patientId=${patient.id}`);
  await page.getByLabel("Local de atendimento").selectOption(unit.id);
  await page.getByLabel("Paciente").selectOption(patient.id);
  await page.locator('input[type="date"]').first().fill(appointmentDate);
  await page.getByRole("textbox", { name: "Início", exact: true }).fill("10:00");
  await page.getByRole("textbox", { name: "Fim", exact: true }).fill("11:00");
  const appointmentResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/agenda/appointments"));
  await page.getByRole("button", { name: "Criar atendimento", exact: true }).click();
  const appointmentResponse = await appointmentResponsePromise;
  expect(appointmentResponse.status()).toBe(201);
  const appointment = await appointmentResponse.json() as { id: string };
  await expect(page.getByText("Atendimento criado.", { exact: true })).toBeVisible();

  await page.goto(`/appointments/start?patientId=${patient.id}&appointmentId=${appointment.id}`);
  await page.getByLabel("Motivo e contexto").fill("TESTE HOMOLOG: avaliação demonstrativa do dente 16.");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByText("Procedimentos", { exact: true }).first().waitFor();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("heading", { name: "Odontograma visual" }).waitFor();
  await page.locator('[role="option"][aria-label="Dente 16"]').click();
  await page.getByRole("button", { name: "+ Planejamento", exact: true }).click();
  await page.getByLabel("Item do tratamento").selectOption(planned.id);
  await page.getByLabel("Status").selectOption("IN_PROGRESS");
  await page.getByLabel("Descrição (opcional)").fill("TESTE HOMOLOG: dente 16 em tratamento.");
  await page.getByRole("button", { name: "Salvar planejamento", exact: true }).click();
  await expect(page.locator('[aria-live="polite"]').first()).toContainText("Registro salvo no dente 16");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Observações do atendimento").fill("TESTE HOMOLOG: validação sintética concluída.");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar tratamento", exact: true }).click();
  await page.getByRole("button", { name: "Finalizar atendimento", exact: true }).click();
  await expect(page.getByText("Atendimento concluído e evolução clínica fechada.", { exact: true })).toBeVisible();

  await page.goto(`/more?section=treatments&patientId=${patient.id}`);
  await page.getByRole("button", { name: new RegExp(treatmentName) }).click();
  await page.getByLabel("Procedimento planejado relacionado").selectOption(planned.id);
  await page.getByLabel("Nome do realizado").fill(planned.name);
  await page.getByLabel("Descrição do realizado").fill("TESTE HOMOLOG: finalização sintética; nenhum procedimento clínico real foi executado.");
  await page.getByRole("button", { name: "Salvar realizado", exact: true }).click();
  await expect(page.getByText("Procedimento realizado salvo como rascunho.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Fechar realizado", exact: true }).click();
  await expect(page.getByText("Procedimento realizado fechado e preservado.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Concluir tratamento", exact: true }).click();
  await expect(page.getByText("Status do tratamento atualizado.", { exact: true })).toBeVisible();

  const finalTreatments = expectStatus(await api<{ items: Array<{ id: string; status: string; plannedProcedures: Array<{ id: string; status: string }> }> }>(page, `/clinical/treatments?patientId=${patient.id}&size=20`), 200);
  expect(finalTreatments.items.find((item) => item.id === treatment.id)).toMatchObject({ status: "COMPLETED", plannedProcedures: [{ id: planned.id, status: "COMPLETED" }] });
  const finalPatient = expectStatus(await api<{ id: string; currentUnitId: string; status: string }>(page, `/patients/${patient.id}`), 200);
  expect(finalPatient).toMatchObject({ id: patient.id, currentUnitId: unit.id, status: "ACTIVE" });
  const agendaRange = await page.evaluate((date) => ({
    from: new Date(`${date}T00:00:00`).toISOString(),
    to: new Date(`${date}T23:59:59`).toISOString(),
  }), appointmentDate);
  const finalAgenda = expectStatus(await api<{ appointments: Array<{ id: string; status: string }> }>(page, `/agenda?from=${encodeURIComponent(agendaRange.from)}&to=${encodeURIComponent(agendaRange.to)}&unitId=${unit.id}`), 200);
  expect(finalAgenda.appointments).toContainEqual(expect.objectContaining({ id: appointment.id, status: "COMPLETED" }));
  const performed = expectStatus(await api<{ items: Array<{ plannedProcedureId: string; status: string }> }>(page, `/clinical/treatments/${treatment.id}/performed-procedures?size=20`), 200);
  expect(performed.items).toContainEqual(expect.objectContaining({ plannedProcedureId: planned.id, status: "CLOSED" }));
  const history = expectStatus(await api<Array<{ appointmentId: string | null; planItemId: string | null; status: string | null }>>(page, `/patients/${patient.id}/teeth/16/history`), 200);
  expect(history).toContainEqual(expect.objectContaining({ appointmentId: appointment.id, planItemId: planned.id, status: "IN_PROGRESS" }));
  const evolutions = expectStatus(await api<{ items: Array<{ appointmentId: string | null; status: string }> }>(page, `/clinical/evolutions?patientId=${patient.id}&page=0&size=20`), 200);
  expect(evolutions.items).toContainEqual(expect.objectContaining({ appointmentId: appointment.id, status: "CLOSED" }));
});
