"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { listPatients } from "@/modules/patient/api";
import {
  changePrivacyRequestStatus,
  createPrivacyRequest,
  listPrivacyRequests,
  type PrivacyRequest,
  type PrivacyRequestStatus,
  type PrivacyRequestType,
} from "@/modules/privacy/api";

export function PrivacyWorkspace() {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [type, setType] = useState<PrivacyRequestType>("ACCESS");
  const [details, setDetails] = useState("");
  const [resolution, setResolution] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "privacy"], queryFn: () => listPatients(), retry: false });
  const requestsQuery = useQuery({ queryKey: ["privacy-requests"], queryFn: () => listPrivacyRequests(), retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const error = (value: unknown) => setMessage(value instanceof ApiError ? value.message : "Não foi possível concluir a operação de privacidade.");
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["privacy-requests"] });
  const createMutation = useMutation({
    mutationFn: () => createPrivacyRequest({ patientId, type, details: details || undefined }),
    onSuccess: async () => { setDetails(""); setMessage("Solicitação registrada para revisão do OWNER."); await refresh(); }, onError: error,
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PrivacyRequestStatus }) => changePrivacyRequestStatus(id, status, resolution),
    onSuccess: async () => { setResolution(""); setMessage("Status atualizado e auditado."); await refresh(); }, onError: error,
  });
  const busy = createMutation.isPending || statusMutation.isPending;
  if (requestsQuery.isError && requestsQuery.error instanceof ApiError && requestsQuery.error.status === 401) return <Card className="p-5"><h2 className="text-lg font-bold">Privacidade</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre como dentista proprietário para acessar este fluxo.</p></Card>;
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"><Card className="p-5 sm:p-6"><p className="text-sm font-semibold text-primary">LGPD · somente OWNER</p><h2 className="mt-1 text-xl font-bold tracking-tight">Registrar solicitação</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">O pedido fica em revisão. Nenhum dado é apagado automaticamente.</p><div className="mt-5 grid gap-3"><FieldSelect label="Patient" value={patientId} onChange={setPatientId} options={patients.map((patient) => ({ value: patient.id, label: patient.fullName }))} /><FieldSelect label="Tipo" value={type} onChange={(value) => setType(value as PrivacyRequestType)} options={[{ value: "ACCESS", label: "Acesso/exportação" }, { value: "RECTIFICATION", label: "Correção" }, { value: "ANONYMIZATION_REVIEW", label: "Avaliar anonimização" }, { value: "DELETION_REVIEW", label: "Avaliar eliminação legal" }]} /><Field label="Detalhes do pedido" value={details} onChange={setDetails} placeholder="Opcional: contexto informado pelo paciente" /><Button disabled={busy || !patientId} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Registrando…" : "Registrar solicitação"}</Button>{message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}</div></Card><Card className="p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Histórico auditável</p><h2 className="mt-1 text-xl font-bold tracking-tight">Solicitações preservadas</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{requestsQuery.data?.totalItems ?? 0}</span></div><Field label="Resolução / observação" value={resolution} onChange={setResolution} placeholder="Obrigatória para encerrar" /><div className="mt-4 grid gap-3">{requestsQuery.isPending ? <p className="text-sm text-muted-foreground">Carregando solicitações…</p> : null}{!requestsQuery.isPending && !requestsQuery.data?.items.length ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhuma solicitação registrada.</p> : null}{requestsQuery.data?.items.map((request) => <RequestCard key={request.id} request={request} busy={busy} onStatus={(status) => statusMutation.mutate({ id: request.id, status })} />)}</div></Card></section>;
}

function RequestCard({ request, busy, onStatus }: { request: PrivacyRequest; busy: boolean; onStatus: (status: PrivacyRequestStatus) => void }) { const closed = ["COMPLETED", "REJECTED", "CANCELED"].includes(request.status); return <article className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{request.type.replaceAll("_", " ")}</p><p className="mt-1 text-sm font-semibold">Patient {request.patientId.slice(0, 8)}</p></div><span className="rounded-full bg-surface-muted px-2 py-1 text-[11px] font-bold">{request.status.replaceAll("_", " ")}</span></div>{request.details ? <p className="mt-2 text-sm leading-5 text-muted-foreground">{request.details}</p> : null}{request.resolution ? <p className="mt-2 text-sm leading-5 text-foreground">Resolução: {request.resolution}</p> : null}{!closed ? <div className="mt-3 flex flex-wrap gap-2">{request.status === "OPEN" ? <Button disabled={busy} onClick={() => onStatus("IN_REVIEW")} size="sm" variant="outline">Em revisão</Button> : <><Button disabled={busy} onClick={() => onStatus("COMPLETED")} size="sm">Concluir</Button><Button disabled={busy} onClick={() => onStatus("REJECTED")} size="sm" variant="ghost">Rejeitar</Button></>}</div> : null}</article>; }
function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><select className="min-h-12 rounded-xl border border-border bg-surface px-3 text-base font-normal" onChange={(event) => onChange(event.target.value)} value={value}>{options.some((option) => option.value === "") ? null : <option value="">Selecione</option>}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><textarea className="min-h-24 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>; }
