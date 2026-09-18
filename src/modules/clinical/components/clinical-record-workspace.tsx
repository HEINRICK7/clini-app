"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import type { ClinicalEvolution } from "@/app/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RelatedSelect, relatedSelectDefaults } from "@/components/ui/related-select";
import { apiErrorMessage, isUnauthorized } from "@/lib/error-policy";

export function ClinicalRecordWorkspace() {
  const { clinical, patient, practice } = useCliniServices();
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [evolutionPage, setEvolutionPage] = useState(0);
  const [unitId, setUnitId] = useState("");
  const [content, setContent] = useState("");
  const [rectificationContent, setRectificationContent] = useState("");
  const [rectificationReason, setRectificationReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: practice.listUnits, retry: false });
  const patientsQuery = useQuery({ queryKey: ["patients", "clinical"], queryFn: () => patient.listPatients(), retry: false });
  const activeUnits = useMemo(() => (unitsQuery.data ?? []).filter((unit) => unit.status === "ACTIVE"), [unitsQuery.data]);
  const activePatients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const evolutionsQuery = useQuery({
    queryKey: ["clinical-evolutions", patientId, evolutionPage],
    queryFn: () => clinical.listClinicalEvolutions(patientId, evolutionPage),
    enabled: Boolean(patientId),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["clinical-evolutions", patientId] });
  const createMutation = useMutation({
    mutationFn: () => clinical.createClinicalEvolution({ patientId, unitId, content }),
    onSuccess: async () => { setContent(""); setMessage("Evolução salva como rascunho."); await refresh(); },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível salvar a evolução.")),
  });
  const closeMutation = useMutation({
    mutationFn: clinical.closeClinicalEvolution,
    onSuccess: async () => { setMessage("Evolução fechada e protegida contra edição direta."); await refresh(); },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível fechar a evolução.")),
  });
  const rectifyMutation = useMutation({
    mutationFn: ({ evolutionId, nextContent, reason }: { evolutionId: string; nextContent: string; reason: string }) => clinical.rectifyClinicalEvolution(evolutionId, nextContent, reason),
    onSuccess: async () => { setRectificationContent(""); setRectificationReason(""); setMessage("Retificação registrada em nova versão."); await refresh(); },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível registrar a retificação.")),
  });
  const busy = createMutation.isPending || closeMutation.isPending || rectifyMutation.isPending;

  if (evolutionsQuery.isError && isUnauthorized(evolutionsQuery.error)) {
    return <Card className="p-5"><h2 className="text-lg font-bold">Prontuário clínico</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre para acessar o prontuário.</p></Card>;
  }
  if (evolutionsQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar as evoluções clínicas.</p></Card>;

  const evolutions = evolutionsQuery.data?.items ?? [];
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <Card className="p-5 sm:p-6">
        <p className="text-sm font-semibold text-primary">Prontuário longitudinal</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">Nova evolução clínica</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">O registro acompanha o paciente entre locais e preserva autor, versão e histórico.</p>
        <div className="mt-5 grid gap-3">
          <ClinicalSelect label="Paciente" value={patientId} onChange={(value) => { setPatientId(value); setEvolutionPage(0); setUnitId(activePatients.find((patient) => patient.id === value)?.currentUnitId ?? ""); setMessage(null); }} options={activePatients.map((patient) => ({ value: patient.id, label: patient.fullName }))} />
          <ClinicalSelect label="Local do atendimento" value={unitId} onChange={setUnitId} options={activeUnits.filter((unit) => !patientId || activePatients.find((patient) => patient.id === patientId)?.currentUnitId === unit.id).map((unit) => ({ value: unit.id, label: unit.name }))} />
          <label className="grid gap-1.5 text-sm font-semibold"><span>Conteúdo clínico</span><textarea className="min-h-36 rounded-xl border border-border bg-surface px-4 py-3 text-base font-normal outline-none focus:border-primary focus:ring-4 focus:ring-cyan-100" onChange={(event) => setContent(event.target.value)} placeholder="Descreva a evolução, exame, diagnóstico e conduta…" value={content} /></label>
          {message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}
          <Button disabled={busy || !patientId || !unitId || !content.trim()} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Salvando…" : "Salvar rascunho"}</Button>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Histórico preservado</p><h2 className="mt-1 text-xl font-bold tracking-tight">Evoluções do paciente</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{evolutions.length}</span></div>
        {!patientId ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm leading-6 text-muted-foreground">Selecione um paciente para consultar o prontuário.</p> : null}
        {patientId && evolutionsQuery.isPending ? <p className="mt-4 text-sm text-muted-foreground">Carregando prontuário…</p> : null}
        {patientId && !evolutionsQuery.isPending && !evolutions.length ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm leading-6 text-muted-foreground">Nenhuma evolução registrada.</p> : null}
        <div className="mt-4 grid gap-3">{evolutions.map((evolution) => <EvolutionCard key={evolution.id} evolution={evolution} busy={busy} onClose={() => closeMutation.mutate(evolution.id)} rectificationContent={rectificationContent} rectificationReason={rectificationReason} setRectificationContent={setRectificationContent} setRectificationReason={setRectificationReason} onRectify={() => rectifyMutation.mutate({ evolutionId: evolution.id, nextContent: rectificationContent, reason: rectificationReason })} />)}{evolutionsQuery.data && evolutionsQuery.data.totalPages > 1 ? <nav aria-label="Paginação de evoluções clínicas" className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Página {evolutionPage + 1} de {evolutionsQuery.data.totalPages} · {evolutionsQuery.data.totalItems} evolução(ões)</p><div className="flex gap-2"><Button disabled={evolutionPage === 0 || evolutionsQuery.isFetching} onClick={() => setEvolutionPage((current) => current - 1)} size="sm" variant="outline">Anterior</Button><Button disabled={evolutionPage + 1 >= evolutionsQuery.data.totalPages || evolutionsQuery.isFetching} onClick={() => setEvolutionPage((current) => current + 1)} size="sm" variant="outline">Próxima</Button></div></nav> : null}</div>
      </Card>
    </section>
  );
}

function EvolutionCard({ evolution, busy, onClose, rectificationContent, rectificationReason, setRectificationContent, setRectificationReason, onRectify }: { evolution: ClinicalEvolution; busy: boolean; onClose: () => void; rectificationContent: string; rectificationReason: string; setRectificationContent: (value: string) => void; setRectificationReason: (value: string) => void; onRectify: () => void }) {
  return <article className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Versão {evolution.version} · {evolution.status === "DRAFT" ? "Rascunho" : "Fechada"}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(evolution.versionCreatedAt).toLocaleString("pt-BR")}</p></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${evolution.status === "CLOSED" ? "bg-green-50 text-success" : "bg-amber-50 text-amber-800"}`}>{evolution.status === "CLOSED" ? "Protegida" : "Em edição"}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{evolution.content}</p>{evolution.changeReason ? <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-xs leading-5 text-muted-foreground">Motivo da alteração: {evolution.changeReason}</p> : null}{evolution.status === "DRAFT" ? <Button className="mt-3" disabled={busy} onClick={onClose} size="sm">Fechar evolução</Button> : <div className="mt-4 grid gap-2 border-t border-border pt-3"><p className="text-sm font-semibold">Retificar com nova versão</p><textarea className="min-h-20 rounded-xl border border-border bg-surface px-3 py-2 text-sm" disabled={busy} onChange={(event) => setRectificationContent(event.target.value)} placeholder="Novo conteúdo clínico" value={rectificationContent} /><input className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm" disabled={busy} onChange={(event) => setRectificationReason(event.target.value)} placeholder="Motivo obrigatório" value={rectificationReason} /><Button disabled={busy || !rectificationContent.trim() || !rectificationReason.trim()} onClick={onRectify} size="sm" variant="outline">Registrar retificação</Button></div>}</article>;
}

function ClinicalSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <RelatedSelect {...relatedSelectDefaults(label)} label={label} onChange={onChange} options={options} value={value} />;
}
