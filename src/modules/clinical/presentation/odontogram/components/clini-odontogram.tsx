"use client";

import { Odontogram, type ToothDetail } from "react-odontogram";
import "@/styles/react-odontogram.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import { Card } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/error-policy";
import type { ToothRecordStatus } from "@/modules/clinical/odontogram-api";
import { permanentFdiTeeth, summaryMap, toothLabel } from "../mappers/odontogram-view-mapper";
import { ToothDetailsSheet } from "./tooth-details-sheet";
import type { ToothAction } from "./tooth-action-menu";

export function CliniOdontogram({ patientId, unitId, appointmentId, readOnly = false }: { patientId: string; unitId: string; appointmentId?: string; readOnly?: boolean }) {
  const { clinicalOdontograms, catalog, clinicalTreatments } = useCliniServices();
  const queryClient = useQueryClient();
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [activeTooth, setActiveTooth] = useState<string | null>(null);
  const [action, setAction] = useState<ToothAction>("CONDITION");
  const [input, setInput] = useState<{ description: string; status?: ToothRecordStatus; procedureId?: string; planItemId?: string }>({ description: "" });
  const [message, setMessage] = useState<string | null>(null);
  const odontogramQuery = useQuery({ queryKey: ["patient-odontogram", patientId], queryFn: () => clinicalOdontograms.getPatientOdontogram(patientId), enabled: Boolean(patientId), retry: false });
  const historyQuery = useQuery({ queryKey: ["tooth-history", patientId, activeTooth], queryFn: () => clinicalOdontograms.getToothHistory(patientId, activeTooth ?? ""), enabled: Boolean(patientId && activeTooth), retry: false });
  const proceduresQuery = useQuery({ queryKey: ["catalog-procedures", unitId], queryFn: () => catalog.listCatalogProcedures({ unitId }), enabled: Boolean(unitId && !readOnly), retry: false });
  const treatmentsQuery = useQuery({ queryKey: ["patient-treatments", patientId], queryFn: () => clinicalTreatments.listTreatments(patientId), enabled: Boolean(patientId && !readOnly), retry: false });
  const summaries = summaryMap(odontogramQuery.data?.teeth ?? []);
  const saveMutation = useMutation({
    mutationFn: async () => {
      const toothIds = selectedTeeth.length ? selectedTeeth : activeTooth ? [activeTooth] : [];
      if (!toothIds.length) throw new Error("Selecione ao menos um dente.");
      if (action === "PROCEDURE") return clinicalOdontograms.registerToothProcedure(patientId, { unitId, appointmentId, toothIds, procedureId: input.procedureId ?? "", status: input.status, description: input.description || undefined });
      if (action === "PLANNING") return clinicalOdontograms.addToTreatmentPlan(patientId, { unitId, appointmentId, toothIds, planItemId: input.planItemId ?? "", description: input.description || undefined });
      if (action === "NOTE") return Promise.all(toothIds.map((toothId) => clinicalOdontograms.registerToothNote(patientId, toothId, { unitId, appointmentId, description: input.description })));
      return Promise.all(toothIds.map((toothId) => clinicalOdontograms.registerToothCondition(patientId, toothId, { unitId, appointmentId, status: input.status, description: input.description || "Condição registrada" })));
    },
    onSuccess: async () => { setMessage("Registro salvo no histórico clínico."); setInput({ description: "" }); await queryClient.invalidateQueries({ queryKey: ["patient-odontogram", patientId] }); await queryClient.invalidateQueries({ queryKey: ["tooth-history", patientId] }); },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível salvar o registro.")),
  });

  const conditionGroups = useMemo(() => [
    { label: "Planejamento aberto", teeth: [...summaries.values()].filter((tooth) => tooth.hasOpenPlanning).map((tooth) => `teeth-${tooth.toothId}`), outlineColor: "#b45309", fillColor: "#fef3c7" },
    { label: "Tratamento em andamento", teeth: [...summaries.values()].filter((tooth) => tooth.hasActiveTreatment).map((tooth) => `teeth-${tooth.toothId}`), outlineColor: "#1d4ed8", fillColor: "#dbeafe" },
    { label: "Com histórico", teeth: [...summaries.values()].filter((tooth) => tooth.hasRecords && !tooth.hasOpenPlanning && !tooth.hasActiveTreatment).map((tooth) => `teeth-${tooth.toothId}`), outlineColor: "#047857", fillColor: "#d1fae5" },
  ], [summaries]);

  function handleChange(details: ToothDetail[]) {
    const next = details.map((detail) => detail.notations.fdi).filter((id) => permanentFdiTeeth.includes(id as typeof permanentFdiTeeth[number]));
    setSelectedTeeth(next);
    if (next.length) setActiveTooth(next[next.length - 1]);
  }

  if (odontogramQuery.isLoading) return <Card className="p-5 text-sm text-muted-foreground">Carregando odontograma…</Card>;
  if (odontogramQuery.isError) return <Card className="p-5 text-sm text-danger">{apiErrorMessage(odontogramQuery.error, "Não foi possível carregar o odontograma.")}</Card>;
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)]">
    <Card className="min-w-0 overflow-hidden p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Mapa dentário</p><h2 className="mt-1 text-xl font-bold">Odontograma visual</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Clique nos dentes para consultar o histórico. Use Ctrl/Cmd ou toque em mais de um dente para registrar um procedimento em lote.</p></div><span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-muted-foreground">{selectedTeeth.length} selecionado(s)</span></div>
      <div className="mt-5 max-h-[min(62svh,42rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface-muted p-3 sm:p-5 lg:max-h-none"><div className="mx-auto w-full max-w-[22rem]"><Odontogram key={selectedTeeth.join(",")} defaultSelected={selectedTeeth.map((id) => `teeth-${id}`)} onChange={handleChange} readOnly={false} showLabels={false} showTooltip={false} notation="FDI" layout="circle" teethConditions={conditionGroups} colors={{ darkBlue: "#0b1f66", baseBlue: "#5473d8", lightBlue: "#1d4ed8" }} /></div></div>
      {selectedTeeth.length ? <div className="mt-4 rounded-xl border border-primary/20 bg-blue-50/60 p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Dentes selecionados</p><div className="mt-2 flex max-h-20 flex-wrap gap-2 overflow-y-auto" aria-label="Dentes selecionados">{selectedTeeth.map((toothId) => <button className={`rounded-full border px-3 py-1.5 text-xs font-bold ${activeTooth === toothId ? "border-primary bg-primary text-white" : "border-primary/30 bg-surface text-primary"}`} key={toothId} onClick={() => setActiveTooth(toothId)} type="button">{toothId}</button>)}</div></div> : null}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Legenda do odontograma">{conditionGroups.map((group) => <span className="inline-flex items-center gap-1.5" key={group.label}><i className="h-3 w-3 rounded border" style={{ backgroundColor: group.fillColor, borderColor: group.outlineColor }} />{group.label}</span>)}<span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded border-2 border-primary" />Selecionado</span></div>
      {message ? <p aria-live="polite" className="mt-4 rounded-xl bg-cyan-50 px-3 py-2 text-sm text-brand-navy">{message}</p> : null}
    </Card>
    {activeTooth ? <ToothDetailsSheet action={action} historyLoading={historyQuery.isLoading} input={input} onActionChange={setAction} onClose={() => setActiveTooth(null)} onInputChange={setInput} onSubmit={() => saveMutation.mutate()} procedures={proceduresQuery.data?.items ?? []} readOnly={readOnly} records={historyQuery.data ?? []} saving={saveMutation.isPending} selectedCount={selectedTeeth.length} selectedTeeth={selectedTeeth} toothId={toothLabel(activeTooth).replace("Dente ", "")} treatments={treatmentsQuery.data?.items ?? []} /> : <Card className="hidden p-5 lg:block"><p className="text-sm font-semibold text-primary">Detalhes do dente</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Selecione um dente no mapa para abrir o histórico e registrar uma condição, procedimento, planejamento ou nota.</p></Card>}
  </section>;
}
