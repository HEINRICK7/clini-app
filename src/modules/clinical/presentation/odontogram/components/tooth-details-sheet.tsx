"use client";

import { X } from "lucide-react";

import type { CatalogProcedure, Treatment, ToothRecord } from "@/app/services";
import { ToothHistory } from "./tooth-history";
import { ToothActionMenu, type ActionInput, type ToothAction } from "./tooth-action-menu";

export function ToothDetailsSheet({ toothId, selectedCount, records, historyLoading, readOnly, action, input, procedures, treatments, saving, onClose, onActionChange, onInputChange, onSubmit }: {
  toothId: string;
  selectedCount: number;
  records: ToothRecord[];
  historyLoading: boolean;
  readOnly: boolean;
  action: ToothAction;
  input: ActionInput;
  procedures: CatalogProcedure[];
  treatments: Treatment[];
  saving: boolean;
  onClose: () => void;
  onActionChange: (action: ToothAction) => void;
  onInputChange: (input: ActionInput) => void;
  onSubmit: () => void;
}) {
  return <aside className="fixed inset-x-0 bottom-0 z-30 max-h-[88vh] overflow-y-auto rounded-t-3xl border border-border bg-surface p-5 shadow-2xl lg:static lg:max-h-none lg:rounded-2xl lg:shadow-sm" aria-label={`Detalhes do ${toothId}`}>
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Histórico clínico</p><h3 className="mt-1 text-xl font-bold">Dente {toothId}</h3><p className="mt-1 text-sm text-muted-foreground">{selectedCount > 1 ? `${selectedCount} dentes selecionados para ação em lote.` : "Selecione uma ação ou consulte os registros."}</p></div>
      <button className="rounded-full p-2 text-muted-foreground hover:bg-surface-muted" onClick={onClose} aria-label="Fechar detalhes" type="button"><X size={19} /></button>
    </div>
    <div className="mt-5 grid gap-5">
      {!readOnly ? <ToothActionMenu action={action} disabled={saving} input={input} onActionChange={onActionChange} onInputChange={onInputChange} onSubmit={onSubmit} procedures={procedures} treatments={treatments} /> : null}
      <div><h4 className="mb-2 text-sm font-bold">Registros anteriores</h4><ToothHistory loading={historyLoading} records={records} /></div>
    </div>
  </aside>;
}
