"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RelatedSelect, relatedSelectDefaults } from "@/components/ui/related-select";
import { apiErrorMessage, isUnauthorized } from "@/lib/error-policy";
import { privacyRequestStatusLabel, privacyRequestTypeLabel } from "@/lib/ui-labels";
import type { PrivacyRequest, PrivacyRequestStatus, PrivacyRequestType } from "@/app/services";

export function PrivacyWorkspace() {
  const { patient, privacy } = useCliniServices();
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState<PrivacyRequestType>("ACCESS");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "privacy"], queryFn: () => patient.listPatients("", 0, 50), retry: false });
  const requestsQuery = useQuery({ queryKey: ["privacy-requests"], queryFn: () => privacy.listPrivacyRequests(), retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const patientNames = useMemo(() => new Map(patients.map((patient) => [patient.id, patient.fullName])), [patients]);
  const error = (value: unknown) => setMessage(apiErrorMessage(value, "Não foi possível concluir a operação de privacidade."));
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["privacy-requests"] });
  const createMutation = useMutation({
    mutationFn: () => privacy.createPrivacyRequest({ patientId, type, details: details || undefined }),
    onSuccess: async () => { setDetails(""); setMessage("Solicitação registrada para revisão."); await refresh(); }, onError: error,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: PrivacyRequestStatus; resolution?: string }) => privacy.changePrivacyRequestStatus(id, status, resolution),
    onSuccess: async () => { setMessage("Situação atualizada."); await refresh(); }, onError: error,
  });
  const busy = createMutation.isPending || statusMutation.isPending;
  if (requestsQuery.isError && isUnauthorized(requestsQuery.error)) return <Card className="p-5"><h2 className="text-lg font-bold">Privacidade</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Sua conta não tem acesso a este fluxo.</p></Card>;
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><Card className="p-4 sm:p-6"><p className="text-sm font-semibold text-primary">Dados pessoais · acesso restrito</p><h2 className="mt-1 text-xl font-bold tracking-tight">Registrar solicitação</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A solicitação fica em revisão. Nenhum dado é apagado automaticamente.</p><div className="mt-5 grid gap-3"><FieldSelect label="Paciente" value={patientId} onChange={setPatientId} options={patients.map((patient) => ({ value: patient.id, label: patient.fullName }))} /><FieldSelect label="Tipo" value={type} onChange={(value) => setType(value as PrivacyRequestType)} options={[{ value: "ACCESS", label: "Acesso/exportação" }, { value: "RECTIFICATION", label: "Correção" }, { value: "ANONYMIZATION_REVIEW", label: "Avaliar anonimização" }, { value: "DELETION_REVIEW", label: "Avaliar eliminação legal" }]} /><Field label="Detalhes do pedido" value={details} onChange={setDetails} placeholder="Opcional: contexto informado pelo paciente" /><Button disabled={busy || !patientId} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Registrando…" : "Registrar solicitação"}</Button>{message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}</div></Card><Card className="p-4 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Histórico de solicitações</p><h2 className="mt-1 text-xl font-bold tracking-tight">Solicitações registradas</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{requestsQuery.data?.totalItems ?? 0}</span></div><div className="mt-4 grid gap-3">{requestsQuery.isPending ? <p className="text-sm text-muted-foreground">Carregando solicitações…</p> : null}{!requestsQuery.isPending && !requestsQuery.data?.items.length ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhuma solicitação registrada.</p> : null}{requestsQuery.data?.items.map((request) => <RequestCard key={request.id} request={request} patientName={patientNames.get(request.patientId) ?? "Paciente"} busy={busy} onStatus={(status, resolution) => statusMutation.mutate({ id: request.id, status, resolution })} />)}</div></Card></section>;
}

function RequestCard({ request, patientName, busy, onStatus }: { request: PrivacyRequest; patientName: string; busy: boolean; onStatus: (status: PrivacyRequestStatus, resolution?: string) => void }) {
  const [resolution, setResolution] = useState("");
  const closed = ["COMPLETED", "REJECTED", "CANCELED"].includes(request.status);
  const resolutionMissing = !resolution.trim();
  return <article className="rounded-2xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{privacyRequestTypeLabel(request.type)}</p><p className="mt-1 text-sm font-semibold">{patientName}</p></div><span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-bold">{privacyRequestStatusLabel(request.status)}</span></div>{request.details ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{request.details}</p> : null}{request.resolution ? <p className="mt-2 text-sm leading-5 text-foreground">Resolução: {request.resolution}</p> : null}{!closed ? <div className="mt-3 grid gap-3">{request.status === "OPEN" ? <div><Button disabled={busy} onClick={() => onStatus("IN_REVIEW")} size="sm" variant="outline">Em análise</Button></div> : <><label className="grid gap-1.5 text-sm font-semibold" htmlFor={`privacy-resolution-${request.id}`}>Justificativa para encerrar (obrigatória)<textarea aria-describedby={`privacy-resolution-help-${request.id}`} className="min-h-24 w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal" id={`privacy-resolution-${request.id}`} maxLength={2000} onChange={(event) => setResolution(event.target.value)} placeholder="Registre a resolução ou o motivo da rejeição" required value={resolution} /></label><p className="text-xs leading-5 text-muted-foreground" id={`privacy-resolution-help-${request.id}`}>Obrigatória para concluir ou rejeitar esta solicitação.</p><div className="flex flex-wrap gap-2"><Button disabled={busy || resolutionMissing} onClick={() => onStatus("COMPLETED", resolution.trim())} size="sm">Concluir</Button><Button disabled={busy || resolutionMissing} onClick={() => onStatus("REJECTED", resolution.trim())} size="sm" variant="ghost">Rejeitar</Button></div></>}</div> : null}</article>;
}
function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <RelatedSelect {...relatedSelectDefaults(label)} label={label} onChange={onChange} options={options} value={value} />; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><textarea className="min-h-24 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>; }
