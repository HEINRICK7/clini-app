import { api, createE2EFixture, expect, expectStatus, loginAsOwner, selectPatient, test } from "./support/e2e-fixtures";

test("gestão clínica: aprova orçamento, liquida parcela e registra receita", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const budgetTitle = `E2E Plano clínico ${suffix}`;
  const dueDate = await page.evaluate(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(date).map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  });

  await page.goto("/more?section=budgets");
  await selectPatient(page, fixture.patientName);
  await page.getByLabel("Consultório de referência").selectOption(fixture.unitId);
  await page.getByLabel("Título").fill(budgetTitle);
  await page.getByLabel("Procedimento do catálogo (opcional)").selectOption(fixture.procedureId);
  await page.getByLabel("Número de parcelas, opcional").fill("2");
  await page.getByLabel("Primeiro vencimento").fill(dueDate);
  const budgetResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/finance/budgets"));
  await page.getByRole("button", { name: "Criar orçamento" }).click();
  const budgetResponse = await budgetResponsePromise;
  expect(budgetResponse.status()).toBe(201);
  const createdBudget = await budgetResponse.json() as { id: string; installments: Array<{ id: string }> };
  await expect(page.getByText("Orçamento criado com preços congelados.", { exact: true })).toBeVisible();
  const budgetCard = page.locator("article").filter({ hasText: budgetTitle });
  await budgetCard.getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByText("Orçamento aprovado.", { exact: true })).toBeVisible();
  const settlePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith(`/finance/budgets/${createdBudget.id}/installments/${createdBudget.installments[0].id}/settle`));
  await budgetCard.getByRole("button", { name: "Liquidar" }).first().click();
  const settleResponse = await settlePromise;
  expect(settleResponse.status()).toBe(200);
  await expect(budgetCard.getByText("Liquidada")).toBeVisible();
  const budgetHistory = expectStatus(await api<{ items: Array<{ id: string; status: string; installments: Array<{ status: string; history: Array<{ paymentMethod: string | null }> }> }> }>(
    page,
    `/finance/budgets?patientId=${fixture.patientId}&size=50`,
  ), 200);
  expect(budgetHistory.items.find((budget) => budget.id === createdBudget.id)).toMatchObject({
    status: "APPROVED",
    installments: [{ status: "SETTLED", history: [{ paymentMethod: "PIX" }] }, { status: "OPEN" }],
  });

  const entryDescription = `E2E Receita clínica ${suffix}`;
  await page.goto("/more?section=finance");
  await page.getByLabel("Descrição").fill(entryDescription);
  await page.getByLabel("Valor (R$)").fill("25,00");
  await page.getByLabel("Consultório (opcional)").selectOption(fixture.unitId);
  await selectPatient(page, fixture.patientName, "Paciente (opcional)");
  const entryResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/finance/entries"));
  await page.getByRole("button", { name: "Adicionar lançamento" }).click();
  const entryResponse = await entryResponsePromise;
  expect(entryResponse.status()).toBe(201);
  const createdEntry = await entryResponse.json() as { id: string };
  await expect(page.getByText("Lançamento criado em aberto.", { exact: true })).toBeVisible();
  const entryCard = page.locator("article").filter({ hasText: entryDescription });
  const settleEntryPromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith(`/finance/entries/${createdEntry.id}/settle`));
  await entryCard.getByRole("button", { name: "Liquidar hoje" }).click();
  const settleEntryResponse = await settleEntryPromise;
  expect(settleEntryResponse.status()).toBe(200);
  await expect(entryCard.getByText("Liquidado")).toBeVisible();
  const entriesHistory = expectStatus(await api<{ items: Array<{ id: string; status: string; amountCents: number }> }>(
    page,
    `/finance/entries?patientId=${fixture.patientId}&size=50`,
  ), 200);
  expect(entriesHistory.items.find((entry) => entry.id === createdEntry.id)).toMatchObject({ status: "SETTLED", amountCents: 2500 });
});
