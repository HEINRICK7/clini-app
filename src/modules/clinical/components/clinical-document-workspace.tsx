"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import type { ClinicalDocument, ClinicalDocumentType } from "@/app/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/error-policy";

const documentTypes: { value: ClinicalDocumentType; label: string }[] = [
  { value: "CLINICAL_REPORT", label: "Relatório clínico" },
  { value: "EXAM_RESULT", label: "Resultado de exame" },
  { value: "REFERRAL", label: "Encaminhamento" },
  { value: "CONSENT", label: "Consentimento" },
  { value: "OTHER", label: "Outro" },
];

export function ClinicalDocumentWorkspace() {
  const { clinicalDocuments, patient: patientService } = useCliniServices();
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [type, setType] = useState<ClinicalDocumentType>("CLINICAL_REPORT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reason, setReason] = useState("");
  const [rectifyContent, setRectifyContent] = useState("");
  const [rectifyReason, setRectifyReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "clinical-documents"], queryFn: () => patientService.listPatients(), retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const patient = patients.find((item) => item.id === patientId);
  const documentsQuery = useQuery({ queryKey: ["clinical-documents", patientId], queryFn: () => clinicalDocuments.listClinicalDocuments(patientId), enabled: Boolean(patientId), retry: false });
  const documents = documentsQuery.data?.items ?? [];
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["clinical-documents", patientId] });
  const mutationError = (error: unknown) => setMessage(apiErrorMessage(error, "Não foi possível concluir a operação no documento."));
  const saveMutation = useMutation({
    mutationFn: () => selectedDocument?.status === "DRAFT" ? clinicalDocuments.updateClinicalDocument(selectedDocument.id, { unitId: patient?.currentUnitId ?? "", title, content, reason: reason || undefined }) : clinicalDocuments.createClinicalDocument({ patientId, unitId: patient?.currentUnitId ?? "", type, title, content, reason: reason || undefined }),
    onSuccess: async (saved) => { setSelectedDocumentId(saved.id); setReason(""); setMessage(`Documento salvo na versão ${saved.version}.`); await refresh(); },
    onError: mutationError,
  });
  const closeMutation = useMutation({ mutationFn: () => clinicalDocuments.closeClinicalDocument(selectedDocument?.id ?? ""), onSuccess: async () => { setMessage("Documento fechado e preservado."); await refresh(); }, onError: mutationError });
  const rectifyMutation = useMutation({ mutationFn: () => clinicalDocuments.rectifyClinicalDocument(selectedDocument?.id ?? "", rectifyContent, rectifyReason), onSuccess: async (saved) => { setRectifyContent(""); setRectifyReason(""); setMessage(`Retificação registrada na versão ${saved.version}.`); await refresh(); }, onError: mutationError });
  const archiveMutation = useMutation({ mutationFn: () => clinicalDocuments.archiveClinicalDocument(selectedDocument?.id ?? ""), onSuccess: async () => { setMessage("Documento arquivado sem apagar o histórico."); await refresh(); }, onError: mutationError });
  const busy = saveMutation.isPending || closeMutation.isPending || rectifyMutation.isPending || archiveMutation.isPending;

  function selectDocument(document: ClinicalDocument) {
    setSelectedDocumentId(document.id); setType(document.type); setTitle(document.title); setContent(document.content); setRectifyContent(document.content); setMessage(null);
  }

  if (documentsQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar os documentos clínicos.</p></Card>;
  const archived = selectedDocument?.status === "ARCHIVED";
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><Card className="p-5 sm:p-6"><p className="text-sm font-semibold text-primary">Prontuário documental</p><h2 className="mt-1 text-xl font-bold tracking-tight">Documentos clínicos</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Registre documentos textuais com checksum, versões e fechamento. Anexos binários terão storage próprio em um próximo ciclo.</p><div className="mt-5 grid gap-3"><ClinicalSelect label="Paciente" value={patientId} onChange={(value) => { setPatientId(value); setSelectedDocumentId(""); setTitle(""); setContent(""); setMessage(null); }} options={patients.map((item) => ({ value: item.id, label: item.fullName }))} /><ClinicalSelect label="Tipo" value={type} onChange={(value) => setType(value as ClinicalDocumentType)} options={documentTypes} /><ClinicalField label="Título" value={title} onChange={setTitle} placeholder="Ex.: Relatório de avaliação" /><label className="grid gap-1.5 text-sm font-semibold"><span>Conteúdo</span><textarea className="min-h-36 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal" onChange={(event) => setContent(event.target.value)} placeholder="Escreva o conteúdo clínico…" value={content} /></label><ClinicalField label="Motivo da versão" value={reason} onChange={setReason} placeholder="Opcional" /><Button disabled={!patientId || !title.trim() || !content.trim() || busy} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? "Salvando…" : selectedDocument?.status === "DRAFT" ? "Salvar rascunho" : "Criar documento"}</Button>{selectedDocument?.status === "DRAFT" ? <Button disabled={busy} onClick={() => closeMutation.mutate()} size="sm" variant="outline">Fechar documento</Button> : null}{selectedDocument?.status === "CLOSED" ? <><ClinicalField label="Motivo da retificação" value={rectifyReason} onChange={setRectifyReason} placeholder="Obrigatório" /><label className="grid gap-1.5 text-sm font-semibold"><span>Conteúdo retificado</span><textarea className="min-h-28 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal" onChange={(event) => setRectifyContent(event.target.value)} value={rectifyContent} /></label><Button disabled={busy || !rectifyReason.trim() || !rectifyContent.trim()} onClick={() => rectifyMutation.mutate()} size="sm" variant="outline">Registrar retificação</Button></> : null}{selectedDocument && !archived ? <Button disabled={busy} onClick={() => archiveMutation.mutate()} size="sm" variant="outline">Arquivar sem excluir</Button> : null}{message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}</div></Card><Card className="p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Histórico do Patient</p><h2 className="mt-1 text-xl font-bold tracking-tight">Documentos e versões atuais</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{documents.length}</span></div>{!patientId ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Selecione um paciente para começar.</p> : null}<div className="mt-4 grid gap-3">{documents.map((document) => <button className={`rounded-2xl border p-4 text-left ${selectedDocumentId === document.id ? "border-primary bg-cyan-50/30" : "border-border"}`} key={document.id} onClick={() => selectDocument(document)} type="button"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{documentTypes.find((item) => item.value === document.type)?.label}</p><h3 className="mt-1 font-bold">{document.title}</h3></div><span className="text-xs text-muted-foreground">v{document.version} · {document.status}</span></div><p className="mt-2 line-clamp-3 text-sm leading-5 text-muted-foreground">{document.content}</p><p className="mt-2 break-all text-[11px] text-muted-foreground">SHA-256: {document.contentSha256}</p></button>)}</div></Card></section>;
}

function ClinicalSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><select className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Selecione</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function ClinicalField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><input className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>; }
