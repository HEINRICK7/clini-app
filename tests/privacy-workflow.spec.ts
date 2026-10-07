import { api, createE2EFixture, expect, expectStatus, loginAsOwner, test } from "./support/e2e-fixtures";

test("privacidade: conclusão exige justificativa e registra o encerramento", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const details = `E2E solicitação de acesso ${Date.now()}`;
  const request = expectStatus(await api<{ id: string }>(page, "/privacy/requests", {
    method: "POST",
    body: { patientId: fixture.patientId, type: "ACCESS", details },
  }), 201);

  await page.goto("/more?section=privacy");
  const requestCard = page.locator("article").filter({ hasText: details });
  await expect(requestCard).toBeVisible();
  await requestCard.getByRole("button", { name: "Em análise" }).click();

  await expect(requestCard.getByLabel("Justificativa para encerrar")).toBeVisible();
  await expect(requestCard.getByRole("button", { name: "Concluir" })).toBeDisabled();
  await expect(requestCard.getByRole("button", { name: "Rejeitar" })).toBeDisabled();

  const resolution = "Dados exportados e entregues ao paciente.";
  await requestCard.getByLabel("Justificativa para encerrar").fill(resolution);
  await requestCard.getByRole("button", { name: "Concluir" }).click();
  await expect(requestCard.getByText("Concluída")).toBeVisible();
  await expect(requestCard.getByText(`Resolução: ${resolution}`)).toBeVisible();

  const pageOfRequests = expectStatus(await api<{ items: Array<{ id: string; status: string; resolution: string | null }> }>(
    page,
    "/privacy/requests?size=50",
  ), 200);
  expect(pageOfRequests.items.find((item) => item.id === request.id)).toMatchObject({ status: "COMPLETED", resolution });
});
