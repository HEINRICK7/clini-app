"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useState } from "react";

import type { CatalogProcedure, Treatment, ToothRecord } from "@/app/services";
import { toothMetadata } from "../mappers/odontogram-view-mapper";
import { ToothHistory } from "./tooth-history";
import { ToothActionMenu, type ActionInput, type ToothAction } from "./tooth-action-menu";

const typeLabels: Record<ToothRecord["type"], string> = {
  CONDITION: "Condição",
  PROCEDURE: "Procedimento",
  PLANNING: "Planejamento",
  NOTE: "Observação",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function recordText(record: ToothRecord) {
  return record.description || typeLabels[record.type] + " registrado";
}

export function ToothDetailsSheet({ toothId, selectedCount, selectedTeeth, records, historyLoading, readOnly, action, input, procedures, treatments, saving, patientId, showNextSteps, canFinish, onClose, onActionChange, onInputChange, onSubmit, onSavedAction }: {
  toothId: string;
  selectedCount: number;
  selectedTeeth: string[];
  records: ToothRecord[];
  historyLoading: boolean;
  readOnly: boolean;
  action: ToothAction | null;
  input: ActionInput;
  procedures: CatalogProcedure[];
  treatments: Treatment[];
  saving: boolean;
  patientId: string;
  showNextSteps: boolean;
  canFinish: boolean;
  onClose: () => void;
  onActionChange: (action: ToothAction) => void;
  onInputChange: (input: ActionInput) => void;
  onSubmit: () => void;
  onSavedAction?: (action: "continue" | "planning" | "another" | "finish") => void;
}) {
  const [showFullHistory, setShowFullHistory] = useState(false);
  const metadata = toothMetadata(toothId);
  const activeRecords = records.filter((record) => record.status !== "CANCELED");
  const conditions = activeRecords.filter((record) => record.type === "CONDITION");
  const proceduresDone = activeRecords.filter((record) => record.type === "PROCEDURE");
  const planning = activeRecords.filter((record) => record.type === "PLANNING");
  const notes = activeRecords.filter((record) => record.type === "NOTE");
  const latest = records[0];

  return <aside className="fixed inset-x-0 bottom-0 z-50 max-h-[min(88svh,46rem)] overflow-y-auto overscroll-contain rounded-t-3xl border border-border bg-surface p-5 pb-24 shadow-2xl lg:static lg:max-h-none lg:rounded-2xl lg:p-5 lg:pb-5 lg:shadow-sm" aria-label={`Detalhes do dente ${toothId}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Contexto do dente</p><h3 className="mt-1 text-2xl font-bold leading-tight">Dente {toothId}</h3><p className="mt-1 text-sm font-semibold capitalize text-foreground">{metadata.name}</p><p className="mt-1 text-xs text-muted-foreground">Arcada {metadata.arch}</p>{selectedCount > 1 ? <div className="mt-2 flex max-h-12 flex-wrap gap-1.5 overflow-y-auto" aria-label="Dentes selecionados no histórico">{selectedTeeth.map((id) => <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${id === toothId ? "bg-primary text-white" : "bg-surface-muted text-muted-foreground"}`} key={id}>{id}</span>)}</div> : null}</div>
      <button className="shrink-0 rounded-full p-2 text-muted-foreground hover:bg-surface-muted" onClick={onClose} aria-label="Fechar detalhes" type="button"><X size={19} /></button>
    </div>

    <section className="mt-5 border-t border-border pt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Situação atual</p><div className="mt-3 grid gap-2">
      <SituationItem label="Condições" items={conditions} empty="Nenhuma condição registrada" />
      <SituationItem label="Procedimentos" items={proceduresDone} empty="Nenhum procedimento registrado" />
      <SituationItem label="Planejamento pendente" items={planning.filter((record) => record.status === "OPEN" || record.status === "IN_PROGRESS")} empty="Nenhum planejamento pendente" />
      <SituationItem label="Observações" items={notes} empty="Nenhuma observação registrada" />
    </div></section>

    <section className="mt-5 border-t border-border pt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Último registro</p>{latest ? <div className="mt-3 rounded-xl bg-surface-muted p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold">{typeLabels[latest.type]}</span><time className="text-xs text-muted-foreground" dateTime={latest.createdAt}>{dateLabel(latest.createdAt)}</time></div><p className="mt-1 text-sm leading-5">{recordText(latest)}</p><OriginLink patientId={patientId} record={latest} /></div> : <p className="mt-3 rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">Nenhum registro clínico neste dente ainda.</p>}</section>

    {!readOnly ? <section className="mt-5 border-t border-border pt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">O que deseja fazer?</p><div className="mt-3"><ToothActionMenu action={action} disabled={saving} input={input} onActionChange={onActionChange} onInputChange={onInputChange} onSubmit={onSubmit} procedures={procedures} treatments={treatments} /></div></section> : null}

    <section className="mt-5 border-t border-border pt-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Histórico completo</p><span className="text-xs text-muted-foreground">{records.length} registro(s)</span></div>{historyLoading ? <p className="mt-3 text-sm text-muted-foreground">Carregando histórico…</p> : <div className="mt-3"><ToothHistory loading={false} patientId={patientId} records={showFullHistory ? records : records.slice(0, 5)} />{records.length > 5 ? <button className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm font-bold text-primary hover:bg-surface-muted" onClick={() => setShowFullHistory((value) => !value)} type="button">{showFullHistory ? "Mostrar menos" : "Ver histórico completo"}</button> : null}</div>}</section>

    {showNextSteps && !readOnly && onSavedAction ? <section className="mt-5 border-t border-border pt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Próximo passo</p><p className="mt-2 text-sm text-muted-foreground">Registro salvo no dente {toothId}. Continue o atendimento como preferir.</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><NextActionButton label="Continuar examinando" onClick={() => onSavedAction("continue")} /><NextActionButton label="Adicionar ao planejamento" onClick={() => { onActionChange("PLANNING"); onSavedAction("planning"); }} /><NextActionButton label="Registrar outro dente" onClick={() => onSavedAction("another")} />{canFinish ? <NextActionButton label="Finalizar atendimento" onClick={() => onSavedAction("finish")} /> : null}</div></section> : null}
  </aside>;
}

function SituationItem({ label, items, empty }: { label: string; items: ToothRecord[]; empty: string }) {
  return <div className="rounded-xl border border-border px-3 py-2.5"><p className="text-xs font-semibold text-muted-foreground">{label}</p>{items.length ? <ul className="mt-1 grid gap-1">{items.slice(0, 2).map((item) => <li className="text-sm font-semibold" key={item.id}>{recordText(item)}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">{empty}</p>}</div>;
}

function OriginLink({ patientId, record }: { patientId: string; record: ToothRecord }) {
  if (!record.appointmentId) return null;
  return <Link className="mt-2 inline-flex text-xs font-semibold text-primary underline-offset-2 hover:underline" href={`/appointments/start?appointmentId=${record.appointmentId}&patientId=${patientId}`}>Abrir atendimento de origem →</Link>;
}

function NextActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button className="min-h-10 rounded-xl border border-border bg-surface px-3 text-left text-xs font-bold text-foreground hover:border-primary hover:text-primary" onClick={onClick} type="button">{label}</button>;
}
