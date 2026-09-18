"use client";

import type { CatalogProcedure, Treatment } from "@/app/services";
import type { ToothRecordStatus } from "@/modules/clinical/odontogram-api";

export type ToothAction = "CONDITION" | "PROCEDURE" | "PLANNING" | "NOTE";

export type ActionInput = {
  description: string;
  status?: ToothRecordStatus;
  procedureId?: string;
  planItemId?: string;
};

export function ToothActionMenu({ action, onActionChange, procedures, treatments, input, onInputChange, onSubmit, disabled }: {
  action: ToothAction;
  onActionChange: (action: ToothAction) => void;
  procedures: CatalogProcedure[];
  treatments: Treatment[];
  input: ActionInput;
  onInputChange: (input: ActionInput) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const planned = treatments.flatMap((treatment) => treatment.plannedProcedures.map((item) => ({ treatment, item })))
    .filter(({ treatment, item }) => treatment.status !== "COMPLETED" && treatment.status !== "CANCELED" && item.status !== "COMPLETED" && item.status !== "CANCELED");
  return <div className="grid gap-3">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Ação no dente">
      {(["CONDITION", "PROCEDURE", "PLANNING", "NOTE"] as ToothAction[]).map((item) => <button className={`min-h-10 rounded-xl border px-3 text-sm font-semibold transition ${action === item ? "border-primary bg-primary text-white" : "border-border bg-surface text-foreground"}`} key={item} onClick={() => onActionChange(item)} type="button">
        {item === "CONDITION" ? "Condição" : item === "PROCEDURE" ? "Procedimento" : item === "PLANNING" ? "Planejar" : "Nota"}
      </button>)}
    </div>
    {action === "PROCEDURE" ? <label className="grid gap-1.5 text-sm font-semibold"><span>Procedimento</span><select className="min-h-11 rounded-xl border border-border bg-surface px-3 font-normal" onChange={(event) => onInputChange({ ...input, procedureId: event.target.value })} value={input.procedureId ?? ""}><option value="">Selecione</option>{procedures.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}</select></label> : null}
    {action === "PLANNING" ? <label className="grid gap-1.5 text-sm font-semibold"><span>Item do tratamento</span><select className="min-h-11 rounded-xl border border-border bg-surface px-3 font-normal" onChange={(event) => onInputChange({ ...input, planItemId: event.target.value })} value={input.planItemId ?? ""}><option value="">Selecione</option>{planned.map(({ treatment, item }) => <option key={item.id} value={item.id}>{treatment.name} · {item.name}</option>)}</select></label> : null}
    {action !== "NOTE" ? <label className="grid gap-1.5 text-sm font-semibold"><span>Status</span><select className="min-h-11 rounded-xl border border-border bg-surface px-3 font-normal" onChange={(event) => onInputChange({ ...input, status: (event.target.value || undefined) as ToothRecordStatus | undefined })} value={input.status ?? ""}><option value="">{action === "PROCEDURE" ? "Concluído" : "Aberto"}</option><option value="OPEN">Aberto</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETED">Concluído</option><option value="CANCELED">Cancelado</option></select></label> : null}
    <label className="grid gap-1.5 text-sm font-semibold"><span>{action === "NOTE" ? "Anotação" : "Descrição (opcional)"}</span><textarea className="min-h-20 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-normal" maxLength={2000} onChange={(event) => onInputChange({ ...input, description: event.target.value })} placeholder="Descreva o registro clínico" value={input.description} /></label>
    <button className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-white disabled:opacity-50" disabled={disabled || (action === "PROCEDURE" && !input.procedureId) || (action === "PLANNING" && !input.planItemId) || (action === "NOTE" && !input.description.trim())} onClick={onSubmit} type="button">{disabled ? "Salvando…" : "Registrar no histórico"}</button>
  </div>;
}
