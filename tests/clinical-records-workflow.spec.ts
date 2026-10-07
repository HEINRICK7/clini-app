import { readFile } from "node:fs/promises";

import { api, createE2EFixture, expect, expectStatus, loginAsOwner, selectPatient, test } from "./support/e2e-fixtures";

test("prontuário: documento, prescrição e anexo ficam salvos no backend", async ({ page }) => {
  await loginAsOwner(page);
  const fixture = await createE2EFixture(page);
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const documentTitle = `E2E Relatório clínico ${suffix}`;
  const documentContent = "Avaliação clínica sintética para validação de homologação.";

  await page.goto("/more?section=documents");
  await selectPatient(page, fixture.patientName);
  await page.getByLabel("Título").fill(documentTitle);
  await page.getByLabel("Conteúdo").fill(documentContent);
  const documentResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/clinical/documents"));
  await page.getByRole("button", { name: "Criar documento" }).click();
  const documentResponse = await documentResponsePromise;
  expect(documentResponse.status()).toBe(201);
  const document = await documentResponse.json() as { id: string };
  await expect(page.getByText("Documento salvo na versão 1.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Fechar documento" }).click();
  await expect(page.getByText("Documento fechado e preservado.", { exact: true })).toBeVisible();
  const documentHistory = expectStatus(await api<{ items: Array<{ id: string; status: string; version: number; content: string }> }>(
    page,
    `/clinical/documents?patientId=${fixture.patientId}&size=20`,
  ), 200);
  expect(documentHistory.items.find((item) => item.id === document.id)).toMatchObject({ status: "CLOSED", version: 1, content: documentContent });

  await page.goto("/more?section=prescriptions");
  await selectPatient(page, fixture.patientName);
  await page.getByLabel("Medicamento").fill("Ibuprofeno 600 mg");
  await page.getByLabel("Dose").fill("1 comprimido");
  await page.getByLabel("Frequência").fill("A cada 8 horas");
  await page.getByLabel("Duração").fill("3 dias");
  await page.getByRole("button", { name: "Adicionar item" }).click();
  await expect(page.getByText("Item adicionado à próxima versão.", { exact: true })).toBeVisible();
  const prescriptionResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/clinical/prescriptions"));
  await page.getByRole("button", { name: "Criar prescrição" }).click();
  const prescriptionResponse = await prescriptionResponsePromise;
  expect(prescriptionResponse.status()).toBe(201);
  const prescription = await prescriptionResponse.json() as { id: string };
  await expect(page.getByText("Prescrição salva na versão 1.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Fechar prescrição" }).click();
  await expect(page.getByText("Prescrição fechada e preservada.", { exact: true })).toBeVisible();
  const prescriptionHistory = expectStatus(await api<{ items: Array<{ id: string; status: string; version: number; items: Array<{ medicationName: string; dosage: string; frequency: string }> }> }>(
    page,
    `/clinical/prescriptions?patientId=${fixture.patientId}&size=20`,
  ), 200);
  expect(prescriptionHistory.items.find((item) => item.id === prescription.id)).toMatchObject({
    status: "CLOSED",
    version: 1,
    items: [{ medicationName: "Ibuprofeno 600 mg", dosage: "1 comprimido", frequency: "A cada 8 horas" }],
  });

  const attachmentFilename = `exame-${suffix}.png`;
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lxoAAAAASUVORK5CYII=", "base64");
  await page.goto("/more?section=attachments");
  await selectPatient(page, fixture.patientName);
  await page.getByLabel("Documento relacionado (opcional)").selectOption(document.id);
  await page.getByLabel("Arquivo").setInputFiles({ name: attachmentFilename, mimeType: "image/png", buffer: png });
  const attachmentResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith("/clinical/attachments"));
  await page.getByRole("button", { name: "Enviar anexo" }).click();
  const attachmentResponse = await attachmentResponsePromise;
  expect(attachmentResponse.status()).toBe(201);
  const attachment = await attachmentResponse.json() as { id: string; clinicalDocumentId: string };
  expect(attachment.clinicalDocumentId).toBe(document.id);
  await expect(page.getByText(`Anexo ${attachmentFilename} armazenado.`, { exact: true })).toBeVisible();

  const attachmentCard = page.locator("article").filter({ hasText: attachmentFilename });
  const downloadPromise = page.waitForEvent("download");
  await attachmentCard.getByRole("button", { name: "Baixar" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(attachmentFilename);
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  if (!downloadedPath) throw new Error("O navegador não salvou o anexo baixado.");
  expect(await readFile(downloadedPath)).toEqual(png);
  await expect(page.getByText("Arquivo baixado.", { exact: true })).toBeVisible();

  const archiveResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname.endsWith(`/clinical/attachments/${attachment.id}/archive`));
  await attachmentCard.getByRole("button", { name: "Arquivar" }).click();
  const archiveResponse = await archiveResponsePromise;
  expect(archiveResponse.status()).toBe(200);
  await expect(attachmentCard.getByText("Arquivado")).toBeVisible();
  const attachmentHistory = expectStatus(await api<{ items: Array<{ id: string; status: string; clinicalDocumentId: string | null }> }>(
    page,
    `/clinical/attachments?patientId=${fixture.patientId}&size=20`,
  ), 200);
  expect(attachmentHistory.items.find((item) => item.id === attachment.id)).toMatchObject({ status: "ARCHIVED", clinicalDocumentId: document.id });
});
