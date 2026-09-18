"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import type { CatalogProcedure, Treatment } from "@/app/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RelatedSelect } from "@/components/ui/related-select";
import { apiErrorMessage, isUnauthorized } from "@/lib/error-policy";

export function TreatmentWorkspace() {
  const searchParams = useSearchParams();
  const { catalog, clinicalTreatments, patient: patientService, practice } = useCliniServices();
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState(() => searchParams.get("patientId") ?? "");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [plannedName, setPlannedName] = useState("");
  const [plannedNotes, setPlannedNotes] = useState("");
  const [plannedCatalogId, setPlannedCatalogId] = useState("");
  const [performedName, setPerformedName] = useState("");
  const [performedContent, setPerformedContent] = useState("");
  const [performedPlannedId, setPerformedPlannedId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const requestedPatientId = searchParams.get("patientId") ?? "";
  const patientsQuery = useQuery({ queryKey: ["patients", "treatments"], queryFn: () => patientService.listPatients(), retry: false });
  const requestedPatientQuery = useQuery({ queryKey: ["patient", "treatments", requestedPatientId], queryFn: () => patientService.getPatient(requestedPatientId), enabled: Boolean(requestedPatientId), retry: false });
  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: practice.listUnits, retry: false });
  const patients = useMemo(() => {
    const listed = (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE");
    const contextual = requestedPatientQuery.data?.status === "ACTIVE" ? [requestedPatientQuery.data] : [];
    return [...new Map([...contextual, ...listed].map((patient) => [patient.id, patient])).values()];
  }, [patientsQuery.data, requestedPatientQuery.data]);
  const selectedPatient = requestedPatientQuery.data ?? patients.find((patient) => patient.id === patientId);
  const catalogQuery = useQuery({ queryKey: ["catalog-procedures", "treatment", selectedPatient?.currentUnitId], queryFn: () => catalog.listCatalogProcedures({ unitId: selectedPatient?.currentUnitId }), enabled: Boolean(selectedPatient?.currentUnitId), retry: false });
  const treatmentsQuery = useQuery({ queryKey: ["treatments", patientId], queryFn: () => clinicalTreatments.listTreatments(patientId), enabled: Boolean(patientId), retry: false });
  const performedQuery = useQuery({ queryKey: ["performed-procedures", selectedTreatmentId], queryFn: () => clinicalTreatments.listPerformedProcedures(selectedTreatmentId), enabled: Boolean(selectedTreatmentId), retry: false });
  const refreshTreatments = () => queryClient.invalidateQueries({ queryKey: ["treatments", patientId] });
  const refreshPerformed = () => queryClient.invalidateQueries({ queryKey: ["performed-procedures", selectedTreatmentId] });
  const mutationError = (error: unknown, fallback: string) => setMessage(apiErrorMessage(error, fallback));
  const createMutation = useMutation({ mutationFn: () => clinicalTreatments.createTreatment({ patientId, name, notes: notes || undefined }), onSuccess: async (treatment) => { setName(""); setNotes(""); setSelectedTreatmentId(treatment.id); setMessage("Tratamento criado como planejado."); await refreshTreatments(); }, onError: (error) => mutationError(error, "Não foi possível criar o tratamento.") });
  const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: Treatment["status"] }) => clinicalTreatments.changeTreatmentStatus(id, status), onSuccess: async () => { setMessage("Status do tratamento atualizado."); await refreshTreatments(); }, onError: (error) => mutationError(error, "Não foi possível atualizar o tratamento.") });
  const plannedMutation = useMutation({ mutationFn: () => clinicalTreatments.addPlannedProcedure(selectedTreatmentId, { name: plannedCatalogId ? undefined : plannedName, catalogProcedureId: plannedCatalogId || undefined, notes: plannedNotes || undefined, expectedUnitId: selectedPatient?.currentUnitId }), onSuccess: async () => { setPlannedName(""); setPlannedNotes(""); setPlannedCatalogId(""); setMessage("Procedimento planejado adicionado."); await refreshTreatments(); }, onError: (error) => mutationError(error, "Não foi possível adicionar o procedimento planejado.") });
  const performedMutation = useMutation({ mutationFn: () => clinicalTreatments.createPerformedProcedure(selectedTreatmentId, { plannedProcedureId: performedPlannedId || undefined, unitId: selectedPatient?.currentUnitId ?? "", name: performedName, content: performedContent }), onSuccess: async () => { setPerformedName(""); setPerformedContent(""); setPerformedPlannedId(""); setMessage("Procedimento realizado salvo como rascunho."); await refreshPerformed(); }, onError: (error) => mutationError(error, "Não foi possível registrar o procedimento realizado.") });
  const closePerformedMutation = useMutation({ mutationFn: clinicalTreatments.closePerformedProcedure, onSuccess: async () => { setMessage("Procedimento realizado fechado e preservado."); await refreshPerformed(); }, onError: (error) => mutationError(error, "Não foi possível fechar o procedimento.") });
  const busy = createMutation.isPending || statusMutation.isPending || plannedMutation.isPending || performedMutation.isPending || closePerformedMutation.isPending;

  if (treatmentsQuery.isError && isUnauthorized(treatmentsQuery.error)) return <Card className="p-5"><h2 className="text-lg font-bold">Tratamentos</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre para acessar os tratamentos.</p></Card>;
  if (treatmentsQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar os tratamentos.</p></Card>;

  const treatments = treatmentsQuery.data?.items ?? [];
  const activeUnits = (unitsQuery.data ?? []).filter((unit) => unit.status === "ACTIVE");
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
    <Card className="p-5 sm:p-6">
      <p className="text-sm font-semibold text-primary">Plano clínico</p>
      <h2 className="mt-1 text-xl font-bold tracking-tight">Tratamentos e procedimentos</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">O tratamento atravessa consultas e locais; cada procedimento realizado preserva a Unit em que ocorreu.</p>
      <div className="mt-5 grid gap-3">
        <RelatedSelect emptyDescription="Cadastre um paciente para começar um tratamento." emptyHref="/patients" emptyLabel="Cadastrar paciente" label="Paciente" loading={patientsQuery.isPending} onChange={(value) => { setPatientId(value); setSelectedTreatmentId(""); setMessage(null); }} options={patients.map((patient) => ({ value: patient.id, label: patient.fullName }))} value={patientId} />
        <ClinicalField label="Nome do tratamento" value={name} onChange={setName} />
        <ClinicalField label="Notas do planejamento" value={notes} onChange={setNotes} />
        <Button disabled={busy || !patientId || !name.trim()} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Salvando…" : "Criar tratamento"}</Button>
        {message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}
      </div>
    </Card>
    <Card className="p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Paciente selecionado</p><h2 className="mt-1 text-xl font-bold tracking-tight">Tratamentos ativos e históricos</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{treatments.length}</span></div>
      {!patientId ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Selecione um paciente para começar.</p> : null}
      <div className="mt-4 grid gap-3">{treatments.map((treatment) => <article className={`rounded-2xl border p-4 ${selectedTreatmentId === treatment.id ? "border-primary bg-cyan-50/30" : "border-border"}`} key={treatment.id}>
        <button className="w-full text-left" onClick={() => setSelectedTreatmentId(treatment.id)} type="button"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{treatment.status}</p><h3 className="mt-1 font-bold">{treatment.name}</h3></div><span className="text-xs text-muted-foreground">{treatment.plannedProcedures.length} planejado(s)</span></div><p className="mt-2 text-sm leading-5 text-muted-foreground">{treatment.notes || "Sem notas adicionais."}</p></button>
        <div className="mt-3 flex flex-wrap gap-2">{treatment.status === "PLANNED" ? <Button disabled={busy} onClick={() => statusMutation.mutate({ id: treatment.id, status: "ACTIVE" })} size="sm">Ativar</Button> : null}{treatment.status === "ACTIVE" ? <Button disabled={busy} onClick={() => statusMutation.mutate({ id: treatment.id, status: "PAUSED" })} size="sm" variant="outline">Pausar</Button> : null}{treatment.status === "PAUSED" ? <Button disabled={busy} onClick={() => statusMutation.mutate({ id: treatment.id, status: "ACTIVE" })} size="sm">Retomar</Button> : null}</div>
        {selectedTreatmentId === treatment.id ? <TreatmentDetails catalogLoading={catalogQuery.isPending} onFocusPlannedName={() => document.getElementById("planned-procedure-name")?.focus()} treatment={treatment} activeUnits={activeUnits} catalogProcedures={catalogQuery.data?.items ?? []} plannedCatalogId={plannedCatalogId} setPlannedCatalogId={setPlannedCatalogId} plannedName={plannedName} plannedNotes={plannedNotes} setPlannedName={setPlannedName} setPlannedNotes={setPlannedNotes} plannedBusy={busy} onAddPlanned={() => plannedMutation.mutate()} performed={performedQuery.data?.items ?? []} performedName={performedName} performedContent={performedContent} performedPlannedId={performedPlannedId} setPerformedPlannedId={setPerformedPlannedId} setPerformedName={setPerformedName} setPerformedContent={setPerformedContent} performedBusy={busy} onCreatePerformed={() => performedMutation.mutate()} onClosePerformed={(id) => closePerformedMutation.mutate(id)} /> : null}
      </article>)}</div>
    </Card>
  </section>;
}

function TreatmentDetails({ treatment, activeUnits, catalogProcedures, catalogLoading, plannedCatalogId, setPlannedCatalogId, plannedName, plannedNotes, setPlannedName, setPlannedNotes, plannedBusy, onAddPlanned, onFocusPlannedName, performed, performedName, performedContent, performedPlannedId, setPerformedPlannedId, setPerformedName, setPerformedContent, performedBusy, onCreatePerformed, onClosePerformed }: { treatment: Treatment; activeUnits: { id: string; name: string }[]; catalogProcedures: CatalogProcedure[]; catalogLoading: boolean; plannedCatalogId: string; setPlannedCatalogId: (value: string) => void; plannedName: string; plannedNotes: string; setPlannedName: (value: string) => void; setPlannedNotes: (value: string) => void; plannedBusy: boolean; onAddPlanned: () => void; onFocusPlannedName: () => void; performed: { id: string; name: string; status: "DRAFT" | "CLOSED"; version: number; content: string }[]; performedName: string; performedContent: string; performedPlannedId: string; setPerformedPlannedId: (value: string) => void; setPerformedName: (value: string) => void; setPerformedContent: (value: string) => void; performedBusy: boolean; onCreatePerformed: () => void; onClosePerformed: (id: string) => void }) {
  const plannedOptions = treatment.plannedProcedures.filter((procedure) => procedure.status !== "CANCELED").map((procedure) => ({ value: procedure.id, label: procedure.name }));
  return <div className="mt-4 grid gap-3 border-t border-border pt-4">
    <p className="text-sm font-semibold">Procedimentos planejados</p>
    {treatment.plannedProcedures.length ? treatment.plannedProcedures.map((procedure) => <div className="rounded-xl bg-surface-muted px-3 py-2 text-sm" key={procedure.id}><div className="flex justify-between gap-2"><span className="font-semibold">{procedure.name}</span><span className="text-xs text-muted-foreground">{procedure.status}</span></div>{procedure.catalogProcedureId ? <p className="mt-1 text-[11px] text-primary">Vinculado ao catálogo</p> : null}{procedure.notes ? <p className="mt-1 text-xs text-muted-foreground">{procedure.notes}</p> : null}</div>) : <p className="rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">Nenhum procedimento planejado. Adicione o primeiro abaixo.</p>}
    <RelatedSelect emptyDescription="Cadastre no catálogo ou use o nome livre abaixo." emptyHref="/more?section=catalog" emptyLabel="Cadastrar procedimento" label="Procedimento do catálogo (opcional)" loading={catalogLoading} onChange={(value) => { setPlannedCatalogId(value); setPlannedName(catalogProcedures.find((item) => item.id === value)?.name ?? ""); }} options={catalogProcedures.map((procedure) => ({ value: procedure.id, label: procedure.name }))} value={plannedCatalogId} />
    <ClinicalField id="planned-procedure-name" label="Nome do procedimento" value={plannedName} onChange={(value) => { setPlannedCatalogId(""); setPlannedName(value); }} />
    <ClinicalField label="Observação" value={plannedNotes} onChange={setPlannedNotes} />
    <Button disabled={plannedBusy || treatment.status === "COMPLETED" || treatment.status === "CANCELED" || (!plannedCatalogId && !plannedName.trim())} onClick={onAddPlanned} size="sm" variant="outline">Adicionar planejado</Button>
    <p className="mt-2 text-sm font-semibold">Procedimentos realizados</p>
    {performed.map((procedure) => <div className="rounded-xl border border-border px-3 py-2 text-sm" key={procedure.id}><div className="flex justify-between gap-2"><span className="font-semibold">{procedure.name}</span><span className="text-xs text-muted-foreground">v{procedure.version} · {procedure.status}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{procedure.content}</p>{procedure.status === "DRAFT" ? <Button className="mt-2" disabled={performedBusy} onClick={() => onClosePerformed(procedure.id)} size="sm">Fechar realizado</Button> : null}</div>)}
    <RelatedSelect emptyAction={{ label: "Adicionar procedimento planejado", onClick: onFocusPlannedName }} emptyDescription="Nenhum item planejado para relacionar. Adicione um acima antes de registrar o realizado." label="Procedimento planejado relacionado" onChange={setPerformedPlannedId} options={plannedOptions} value={performedPlannedId} />
    <ClinicalField label="Nome do realizado" value={performedName} onChange={setPerformedName} />
    <ClinicalField label="Descrição do realizado" value={performedContent} onChange={setPerformedContent} />
    <Button disabled={performedBusy || treatment.status !== "ACTIVE" || !performedName.trim() || !performedContent.trim() || !activeUnits.length} onClick={onCreatePerformed} size="sm">Salvar realizado</Button>
  </div>;
}

function ClinicalField({ id, label, value, onChange }: { id?: string; label: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><input id={id} className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} value={value} /></label>; }
