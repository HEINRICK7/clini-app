"use client";

import { Odontogram, type ToothDetail } from "react-odontogram";
import "@/styles/react-odontogram.css";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import type { ToothRecord, ToothRecordStatus } from "@/app/services";
import { Card } from "@/components/ui/card";
import { apiErrorMessage } from "@/lib/error-policy";
import type { AdvancedOdontogramPayload } from "@/modules/clinical/odontogram-api";
import { permanentFdiTeeth, summaryMap } from "../mappers/odontogram-view-mapper";
import { ToothDetailsSheet } from "./tooth-details-sheet";
import type { ToothAction } from "./tooth-action-menu";

const AdvancedClinicalOdontogram = dynamic(
  () => import("@/modules/clinical/components/advanced-clinical-odontogram").then((module) => module.AdvancedClinicalOdontogram),
  { ssr: false, loading: () => <Card className="p-5 text-sm text-muted-foreground">Abrindo o odontograma clínico…</Card> },
);

export function CliniOdontogram({ patientId, unitId, appointmentId, readOnly = false, onFinishAppointment, onContinueAppointment }: { patientId: string; unitId: string; appointmentId?: string; readOnly?: boolean; onFinishAppointment?: () => void; onContinueAppointment?: () => void }) {
  const { clinicalOdontograms, catalog, clinicalTreatments } = useCliniServices();
  const queryClient = useQueryClient();
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [activeTooth, setActiveTooth] = useState<string | null>(null);
  const [action, setAction] = useState<ToothAction | null>(null);
  const [input, setInput] = useState<{ description: string; status?: ToothRecordStatus; procedureId?: string; planItemId?: string }>({ description: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [showNextSteps, setShowNextSteps] = useState(false);
  const [activeView, setActiveView] = useState<"advanced" | "history">(() =>
    readOnly || onFinishAppointment || onContinueAppointment ? "history" : "advanced");
  const idempotencyKeyRef = useRef<string | null>(null);
  const odontogramRootRef = useRef<HTMLDivElement>(null);
  const odontogramQuery = useQuery({ queryKey: ["patient-odontogram", patientId], queryFn: () => clinicalOdontograms.getPatientOdontogram(patientId), enabled: Boolean(patientId), retry: false });
  const versionedOdontogramQuery = useQuery({
    queryKey: ["versioned-odontogram", patientId],
    queryFn: () => clinicalOdontograms.getOdontogramIfExists(patientId),
    enabled: Boolean(patientId),
    retry: false,
  });
  const historyQuery = useQuery({ queryKey: ["tooth-history", patientId, activeTooth], queryFn: () => clinicalOdontograms.getToothHistory(patientId, activeTooth ?? ""), enabled: Boolean(patientId && activeTooth), retry: false });
  const proceduresQuery = useQuery({ queryKey: ["catalog-procedures", unitId], queryFn: () => catalog.listCatalogProcedures({ unitId, configuredOnly: true }), enabled: Boolean(unitId && !readOnly), retry: false });
  const treatmentsQuery = useQuery({ queryKey: ["patient-treatments", patientId], queryFn: () => clinicalTreatments.listTreatments(patientId), enabled: Boolean(patientId && !readOnly), retry: false });
  const summaries = summaryMap(odontogramQuery.data?.teeth ?? []);
  const advancedSaveMutation = useMutation({
    mutationFn: (chartPayload: AdvancedOdontogramPayload) => versionedOdontogramQuery.data
      ? clinicalOdontograms.createOdontogramVersion(versionedOdontogramQuery.data.id, {
          unitId, appointmentId, reason: "Atualização do odontograma clínico", teeth: [], chartPayload,
        })
      : clinicalOdontograms.createOdontogram({
          patientId, unitId, appointmentId, reason: "Primeiro registro do odontograma clínico", teeth: [], chartPayload,
        }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["versioned-odontogram", patientId], saved);
      setMessage(`Odontograma salvo na versão ${saved.version}.`);
    },
  });
  const saveMutation = useMutation({
    mutationFn: async (): Promise<{ records: ToothRecord[]; toothIds: string[] }> => {
      const toothIds = selectedTeeth.length ? selectedTeeth : activeTooth ? [activeTooth] : [];
      if (!toothIds.length) throw new Error("Selecione ao menos um dente.");
      if (!action) throw new Error("Escolha uma ação para registrar.");
      const idempotencyKey = idempotencyKeyRef.current ??= createIdempotencyKey();
      let saved: ToothRecord[];
      if (action === "PROCEDURE") saved = await clinicalOdontograms.registerToothProcedure(patientId, { unitId, appointmentId, toothIds, procedureId: input.procedureId ?? "", status: input.status, description: input.description || undefined, idempotencyKey });
      else if (action === "PLANNING") saved = await clinicalOdontograms.addToTreatmentPlan(patientId, { unitId, appointmentId, toothIds, planItemId: input.planItemId ?? "", status: input.status, description: input.description || undefined, idempotencyKey });
      else if (action === "NOTE") saved = await Promise.all(toothIds.map((toothId) => clinicalOdontograms.registerToothNote(patientId, toothId, { unitId, appointmentId, description: input.description, idempotencyKey })));
      else saved = await Promise.all(toothIds.map((toothId) => clinicalOdontograms.registerToothCondition(patientId, toothId, { unitId, appointmentId, status: input.status, description: input.description || "Condição registrada", idempotencyKey })));
      return { records: saved, toothIds };
    },
    onSuccess: () => { idempotencyKeyRef.current = null; setMessage(`✓ Registro salvo no dente ${activeTooth ?? "selecionado"}.`); setInput({ description: "" }); setAction(null); setShowNextSteps(true); void queryClient.invalidateQueries({ queryKey: ["patient-odontogram", patientId] }); void queryClient.invalidateQueries({ queryKey: ["tooth-history", patientId] }); },
    onError: (error) => { setMessage(apiErrorMessage(error, "Não foi possível salvar o registro.")); },
  });

  const conditionGroups = useMemo(() => [
    { label: "Planejamento aberto", teeth: [...summaries.values()].filter((tooth) => tooth.hasOpenPlanning).map((tooth) => `teeth-${tooth.toothId}`), outlineColor: "#b45309", fillColor: "#fef3c7" },
    { label: "Tratamento em andamento", teeth: [...summaries.values()].filter((tooth) => tooth.hasActiveTreatment).map((tooth) => `teeth-${tooth.toothId}`), outlineColor: "#1d4ed8", fillColor: "#dbeafe" },
    { label: "Com histórico", teeth: [...summaries.values()].filter((tooth) => tooth.hasRecords && !tooth.hasOpenPlanning && !tooth.hasActiveTreatment).map((tooth) => `teeth-${tooth.toothId}`), outlineColor: "#047857", fillColor: "#d1fae5" },
  ], [summaries]);

  function handleChange(details: ToothDetail[]) {
    const next = details.map((detail) => detail.notations.fdi).filter((id) => permanentFdiTeeth.includes(id as typeof permanentFdiTeeth[number]));
    setSelectedTeeth(next);
    if (next.length) { setActiveTooth(next[next.length - 1]); setShowNextSteps(false); }
  }

  function handleSavedAction(nextAction: "continue" | "planning" | "another" | "finish") {
    if (nextAction === "planning") { setAction("PLANNING"); setShowNextSteps(false); return; }
    if (nextAction === "another") { setSelectedTeeth([]); setActiveTooth(null); setAction(null); setShowNextSteps(false); return; }
    if (nextAction === "finish") { onFinishAppointment?.(); return; }
    setShowNextSteps(false);
    if (onContinueAppointment) onContinueAppointment();
    else setActiveTooth(null);
  }

  function handleActionChange(nextAction: ToothAction) {
    setAction(nextAction);
    setInput({ description: "" });
    setShowNextSteps(false);
  }

  function selectActiveTooth(toothId: string) {
    setActiveTooth(toothId);
    setAction(null);
    setInput({ description: "" });
    setShowNextSteps(false);
  }

  useEffect(() => {
    const root = odontogramRootRef.current;
    if (!root) return;

    const localizeToothLabels = () => {
      root.querySelectorAll<SVGGElement>('[role="option"][aria-label^="Tooth "]').forEach((tooth) => {
        const toothId = tooth.getAttribute("aria-label")?.replace("Tooth ", "");
        if (toothId) tooth.setAttribute("aria-label", `Dente ${toothId}`);
      });
    };
    localizeToothLabels();
    const observer = new MutationObserver(localizeToothLabels);
    observer.observe(root, { attributes: true, attributeFilter: ["aria-label"], childList: true, subtree: true });
    return () => observer.disconnect();
  }, [activeView, selectedTeeth, odontogramQuery.data]);

  if (activeView === "advanced") {
    if (versionedOdontogramQuery.isPending) return <Card className="p-5 text-sm text-muted-foreground">Carregando odontograma clínico…</Card>;
    if (versionedOdontogramQuery.isError) return <section className="grid gap-3"><OdontogramViewTabs activeView={activeView} onChange={setActiveView} /><Card className="p-5 text-sm text-danger">{apiErrorMessage(versionedOdontogramQuery.error, "Não foi possível carregar o odontograma.")}</Card></section>;
    return <section className="grid min-w-0 gap-4">
      <OdontogramViewTabs activeView={activeView} onChange={setActiveView} />
      <div aria-labelledby="advanced-odontogram-tab" className="min-w-0" id="advanced-odontogram-panel" role="tabpanel">
        <AdvancedClinicalOdontogram
          key={patientId}
          initialPayload={versionedOdontogramQuery.data?.chartPayload ?? null}
          onSave={(payload) => advancedSaveMutation.mutateAsync(payload)}
          patientId={patientId}
          readOnly={readOnly || versionedOdontogramQuery.data?.status === "ARCHIVED"}
          savedAt={versionedOdontogramQuery.data?.versionCreatedAt}
          saving={advancedSaveMutation.isPending}
          version={versionedOdontogramQuery.data?.version ?? null}
        />
      </div>
      {message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm text-brand-navy">{message}</p> : null}
    </section>;
  }

  if (odontogramQuery.isLoading) return <section className="grid gap-3"><OdontogramViewTabs activeView={activeView} onChange={setActiveView} /><Card className="p-5 text-sm text-muted-foreground">Carregando histórico por dente…</Card></section>;
  if (odontogramQuery.isError) return <section className="grid gap-3"><OdontogramViewTabs activeView={activeView} onChange={setActiveView} /><Card className="p-5 text-sm text-danger">{apiErrorMessage(odontogramQuery.error, "Não foi possível carregar o histórico odontológico.")}</Card></section>;
  return <section className="grid min-w-0 gap-4">
    <OdontogramViewTabs activeView={activeView} onChange={setActiveView} />
    <div aria-labelledby="tooth-history-tab" className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)]" id="tooth-history-panel" role="tabpanel">
    <Card className="min-w-0 overflow-hidden p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Mapa dentário</p><h2 className="mt-1 text-xl font-bold">Odontograma visual</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Clique nos dentes para consultar o histórico. Use Ctrl/Cmd ou toque em mais de um dente para registrar um procedimento em lote.</p></div><span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-bold text-muted-foreground">{selectedTeeth.length} selecionado(s)</span></div>
      <div ref={odontogramRootRef} className="mt-5 max-h-[min(62svh,42rem)] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface-muted p-3 sm:p-5 lg:max-h-none"><div className="mx-auto w-full max-w-[12rem] sm:max-w-[18rem] lg:max-w-[22rem]"><Odontogram key={selectedTeeth.join(",")} defaultSelected={selectedTeeth.map((id) => `teeth-${id}`)} onChange={handleChange} readOnly={false} showLabels={false} showTooltip={false} notation="FDI" layout="circle" teethConditions={conditionGroups} colors={{ darkBlue: "#0b1f66", baseBlue: "#5473d8", lightBlue: "#1d4ed8" }} /></div></div>
      {selectedTeeth.length ? <div className="mt-4 rounded-xl border border-primary/20 bg-blue-50/60 p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Dentes selecionados</p><div className="mt-2 flex max-h-20 flex-wrap gap-2 overflow-y-auto" aria-label="Dentes selecionados">{selectedTeeth.map((toothId) => <button className={`rounded-full border px-3 py-1.5 text-xs font-bold ${activeTooth === toothId ? "border-primary bg-primary text-white" : "border-primary/30 bg-surface text-primary"}`} key={toothId} onClick={() => selectActiveTooth(toothId)} type="button">{toothId}</button>)}</div></div> : null}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Legenda do odontograma">{conditionGroups.map((group) => <span className="inline-flex items-center gap-1.5" key={group.label}><i className="h-3 w-3 rounded border" style={{ backgroundColor: group.fillColor, borderColor: group.outlineColor }} />{group.label}</span>)}<span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded border-2 border-primary" />Selecionado</span></div>
      {message ? <p aria-live="polite" className="mt-4 rounded-xl bg-cyan-50 px-3 py-2 text-sm text-brand-navy">{message}</p> : null}
    </Card>
    {activeTooth ? <ToothDetailsSheet action={action} canFinish={Boolean(onFinishAppointment)} continueLabel={onContinueAppointment ? "Continuar atendimento" : "Continuar examinando"} historyLoading={historyQuery.isLoading} input={input} onActionChange={handleActionChange} onClose={() => setActiveTooth(null)} onInputChange={setInput} onSavedAction={handleSavedAction} onSubmit={() => saveMutation.mutate()} patientId={patientId} procedures={proceduresQuery.data?.items ?? []} proceduresLoading={proceduresQuery.isPending} readOnly={readOnly} records={historyQuery.data ?? []} saving={saveMutation.isPending} selectedCount={selectedTeeth.length} selectedTeeth={selectedTeeth} showNextSteps={showNextSteps} toothId={activeTooth} treatments={treatmentsQuery.data?.items ?? []} treatmentsLoading={treatmentsQuery.isPending} /> : <Card className="hidden p-5 lg:block"><p className="text-sm font-semibold text-primary">Detalhes do dente</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Selecione um dente no mapa para abrir o histórico e registrar uma condição, procedimento, planejamento ou nota.</p></Card>}
    </div>
  </section>;
}

function OdontogramViewTabs({ activeView, onChange }: { activeView: "advanced" | "history"; onChange: (view: "advanced" | "history") => void }) {
  return <div aria-label="Seções do odontograma" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1" role="tablist">
    <button aria-controls="advanced-odontogram-panel" aria-selected={activeView === "advanced"} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeView === "advanced" ? "bg-white text-brand-navy shadow-sm" : "text-muted-foreground"}`} id="advanced-odontogram-tab" onClick={() => onChange("advanced")} role="tab" type="button">Odontograma</button>
    <button aria-controls="tooth-history-panel" aria-selected={activeView === "history"} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeView === "history" ? "bg-white text-brand-navy shadow-sm" : "text-muted-foreground"}`} id="tooth-history-tab" onClick={() => onChange("history")} role="tab" type="button">Atendimento e histórico</button>
  </div>;
}

function createIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `odontogram-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
