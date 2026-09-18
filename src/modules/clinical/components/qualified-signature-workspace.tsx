"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import type { QualifiedSignatureRequest } from "@/app/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RelatedSelect } from "@/components/ui/related-select";
import { apiErrorMessage } from "@/lib/error-policy";

export function QualifiedSignatureWorkspace() {
  const { clinicalDocuments, clinicalSignatures, patient: patientService } = useCliniServices();
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "qualified-signatures"], queryFn: () => patientService.listPatients(), retry: false });
  const providerStatusQuery = useQuery({ queryKey: ["qualified-signature-provider-status"], queryFn: clinicalSignatures.getQualifiedSignatureProviderStatus, retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const documentsQuery = useQuery({ queryKey: ["clinical-documents", "qualified-signatures", patientId], queryFn: () => clinicalDocuments.listClinicalDocuments(patientId), enabled: Boolean(patientId), retry: false });
  const signaturesQuery = useQuery({ queryKey: ["qualified-signatures", patientId], queryFn: () => clinicalSignatures.listQualifiedSignatures(patientId), enabled: Boolean(patientId), retry: false });
  const documents = documentsQuery.data?.items ?? [];
  const signatures = signaturesQuery.data ?? [];
  const selectedDocument = documents.find((document) => document.id === documentId);
  const selectedSignature = signatures.find((signature) => signature.clinicalDocumentId === documentId);
  const providerConfigured = providerStatusQuery.data?.configured === true;
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["qualified-signatures", patientId] });
    void queryClient.invalidateQueries({ queryKey: ["clinical-documents", "qualified-signatures", patientId] });
  };
  const mutationError = (error: unknown) => setMessage(apiErrorMessage(error, "Não foi possível concluir a operação de assinatura."));
  const requestMutation = useMutation({
    mutationFn: () => clinicalSignatures.requestQualifiedSignature(documentId, crypto.randomUUID()),
    onSuccess: async () => { setMessage("Solicitação preparada. O provedor ICP-Brasil ainda não foi acionado."); await refresh(); },
    onError: mutationError,
  });
  const cancelMutation = useMutation({
    mutationFn: () => clinicalSignatures.cancelQualifiedSignature(selectedSignature?.id ?? "", cancelReason),
    onSuccess: async () => { setCancelReason(""); setMessage("Solicitação cancelada sem apagar o histórico."); await refresh(); },
    onError: mutationError,
  });
  const submitMutation = useMutation({
    mutationFn: () => clinicalSignatures.submitQualifiedSignature(selectedSignature?.id ?? ""),
    onSuccess: async () => { setMessage("Solicitação enviada ao provedor."); await refresh(); },
    onError: mutationError,
  });
  const busy = requestMutation.isPending || cancelMutation.isPending || submitMutation.isPending;

  function selectPatient(value: string) {
    setPatientId(value);
    setDocumentId("");
    setMessage(null);
  }

  if (patientsQuery.isError || providerStatusQuery.isError || documentsQuery.isError || signaturesQuery.isError) {
    return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar o fluxo de assinatura.</p></Card>;
  }

  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
    <Card className="p-5 sm:p-6">
      <p className="text-sm font-semibold text-primary">Integridade clínica</p>
      <h2 className="mt-1 text-xl font-bold tracking-tight">Assinatura qualificada</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Preparamos somente documentos fechados e preservamos a versão e o SHA-256. Nenhum checksum é tratado como assinatura.</p>
      <p className={`mt-4 rounded-xl px-3 py-2 text-sm leading-5 ${providerConfigured ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
        {providerConfigured ? "Provedor ICP-Brasil configurado." : "Integração ICP-Brasil ainda não configurada. A solicitação pode ser preparada, mas não será enviada."}
      </p>
      <div className="mt-5 grid gap-3">
        <RelatedSelect emptyDescription="Cadastre um paciente para preparar uma assinatura." emptyHref="/patients" emptyLabel="Cadastrar paciente" label="Paciente" loading={patientsQuery.isPending} onChange={selectPatient} options={patients.map((patient) => ({ value: patient.id, label: patient.fullName }))} value={patientId} />
        <RelatedSelect disabled={!patientId} emptyDescription="Feche um documento clínico para disponibilizá-lo para assinatura." emptyHref="/more?section=documents" emptyLabel="Cadastrar documento" label="Documento fechado" loading={documentsQuery.isPending} onChange={setDocumentId} options={documents.filter((document) => document.status === "CLOSED").map((document) => ({ value: document.id, label: `${document.title} · v${document.version}` }))} value={documentId} />
        <Button disabled={!selectedDocument || selectedDocument.status !== "CLOSED" || Boolean(selectedSignature) || busy} onClick={() => requestMutation.mutate()}>{requestMutation.isPending ? "Preparando…" : "Preparar assinatura"}</Button>
        {selectedSignature?.status === "READY" ? <>
          <Button disabled={busy || !providerConfigured} onClick={() => submitMutation.mutate()} size="sm" variant="outline">{providerConfigured ? "Enviar ao provedor" : "Provedor não configurado"}</Button>
          <input className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm" onChange={(event) => setCancelReason(event.target.value)} placeholder="Motivo do cancelamento" value={cancelReason} />
          <Button disabled={busy || !cancelReason.trim()} onClick={() => cancelMutation.mutate()} size="sm" variant="outline">Cancelar solicitação</Button>
        </> : null}
        {message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}
      </div>
    </Card>
    <Card className="p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Evidências</p><h2 className="mt-1 text-xl font-bold tracking-tight">Solicitações preservadas</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{signatures.length}</span></div>
      {!patientId ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Selecione um paciente para consultar solicitações.</p> : null}
      <div className="mt-4 grid gap-3">{signatures.map((signature) => <SignatureCard key={signature.id} signature={signature} selected={signature.id === selectedSignature?.id} onSelect={() => setDocumentId(signature.clinicalDocumentId)} />)}</div>
    </Card>
  </section>;
}

function SignatureCard({ signature, selected, onSelect }: { signature: QualifiedSignatureRequest; selected: boolean; onSelect: () => void }) {
  return <button className={`rounded-2xl border p-4 text-left ${selected ? "border-primary bg-cyan-50/30" : "border-border"}`} onClick={onSelect} type="button"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">ICP-Brasil</p><h3 className="mt-1 font-bold">Documento · v{signature.documentVersion}</h3></div><span className="text-xs text-muted-foreground">{signature.status}</span></div><p className="mt-2 break-all text-[11px] text-muted-foreground">SHA-256: {signature.documentContentSha256}</p><p className="mt-2 text-xs text-muted-foreground">{signature.status === "READY" ? "Pronto para integração com o provedor." : signature.cancellationReason ?? signature.externalRequestId ?? "Evidência disponível"}</p></button>;
}
