"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { listPatients } from "@/modules/patient/api";
import { listClinicalDocuments } from "@/modules/clinical/document-api";
import { listUnits } from "@/modules/practice/api";
import { archiveClinicalAttachment, downloadClinicalAttachment, listClinicalAttachments, uploadClinicalAttachment, type ClinicalAttachment } from "@/modules/clinical/attachment-api";

const acceptedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function ClinicalAttachmentWorkspace() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [patientId, setPatientId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "clinical-attachments"], queryFn: () => listPatients(), retry: false });
  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: listUnits, retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const patient = patients.find((item) => item.id === patientId);
  const documentsQuery = useQuery({ queryKey: ["clinical-documents", patientId], queryFn: () => listClinicalDocuments(patientId), enabled: Boolean(patientId), retry: false });
  const attachmentsQuery = useQuery({ queryKey: ["clinical-attachments", patientId], queryFn: () => listClinicalAttachments(patientId), enabled: Boolean(patientId), retry: false });
  const attachments = attachmentsQuery.data?.items ?? [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["clinical-attachments", patientId] });
  const uploadMutation = useMutation({ mutationFn: () => uploadClinicalAttachment({ patientId, unitId: patient?.currentUnitId ?? "", clinicalDocumentId: documentId || undefined, file: file! }), onSuccess: async (saved) => { setFile(null); if (inputRef.current) inputRef.current.value = ""; setMessage(`Anexo ${saved.originalFilename} armazenado com checksum.`); await refresh(); }, onError: showError });
  const archiveMutation = useMutation({ mutationFn: archiveClinicalAttachment, onSuccess: async () => { setMessage("Anexo arquivado sem apagar o conteúdo."); await refresh(); }, onError: showError });
  const busy = uploadMutation.isPending || archiveMutation.isPending;
  const activeUnits = unitsQuery.data?.filter((unit) => unit.status === "ACTIVE") ?? [];

  async function handleDownload(attachment: ClinicalAttachment) {
    try {
      const blob = await downloadClinicalAttachment(attachment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = attachment.originalFilename; link.click(); URL.revokeObjectURL(url);
      setMessage("Download autorizado e registrado na auditoria.");
    } catch (error) { showError(error); }
  }

  function handleFileChange(candidate: File | null) {
    if (!candidate) { setFile(null); return; }
    if (!acceptedTypes.includes(candidate.type) || candidate.size > 15 * 1024 * 1024) { setFile(null); setMessage("Use PDF, JPEG, PNG ou WEBP com no máximo 15 MB."); return; }
    setFile(candidate); setMessage(null);
  }

  function showError(error: unknown) { setMessage(error instanceof ApiError ? error.message : "Não foi possível concluir a operação do anexo."); }

  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><Card className="p-5 sm:p-6"><p className="text-sm font-semibold text-primary">Prontuário documental</p><h2 className="mt-1 text-xl font-bold tracking-tight">Anexos clínicos</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Armazene exames e imagens com checksum, acesso autenticado e histórico preservado. O conteúdo nunca é apagado pela operação clínica.</p><div className="mt-5 grid gap-3"><ClinicalSelect label="Paciente" value={patientId} onChange={(value) => { setPatientId(value); setDocumentId(""); setFile(null); setMessage(null); }} options={patients.map((item) => ({ value: item.id, label: item.fullName }))} /><ClinicalSelect label="Documento relacionado (opcional)" value={documentId} onChange={setDocumentId} options={(documentsQuery.data?.items ?? []).filter((item) => item.status !== "ARCHIVED").map((item) => ({ value: item.id, label: `${item.title} · v${item.version}` }))} /><label className="grid gap-1.5 text-sm font-semibold"><span>Arquivo</span><input ref={inputRef} accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" className="min-h-12 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-normal" onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)} type="file" /></label>{file ? <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted-foreground">{file.name} · {formatBytes(file.size)}</p> : null}<Button disabled={!patientId || !patient || !activeUnits.length || !file || busy} onClick={() => uploadMutation.mutate()}>{uploadMutation.isPending ? "Enviando…" : "Enviar anexo"}</Button>{message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}</div></Card><Card className="p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Histórico do Patient</p><h2 className="mt-1 text-xl font-bold tracking-tight">Arquivos protegidos</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{attachments.length}</span></div>{!patientId ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Selecione um paciente para consultar anexos.</p> : null}<div className="mt-4 grid gap-3">{attachments.map((attachment) => <article className="rounded-2xl border border-border p-4" key={attachment.id}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-bold">{attachment.originalFilename}</h3><p className="mt-1 text-xs text-muted-foreground">{attachment.contentType} · {formatBytes(attachment.sizeBytes)} · {attachment.status}</p></div><span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-bold text-muted-foreground">{attachment.status === "ACTIVE" ? "Ativo" : "Arquivado"}</span></div><p className="mt-2 break-all text-[11px] text-muted-foreground">SHA-256: {attachment.sha256}</p><div className="mt-3 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void handleDownload(attachment)} size="sm" variant="outline">Baixar</Button>{attachment.status === "ACTIVE" ? <Button disabled={busy} onClick={() => archiveMutation.mutate(attachment.id)} size="sm" variant="ghost">Arquivar</Button> : null}</div></article>)}</div></Card></section>;
}

function ClinicalSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><select className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Selecione</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function formatBytes(value: number) { if (value < 1024) return `${value} B`; if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`; return `${(value / (1024 * 1024)).toFixed(1)} MB`; }
