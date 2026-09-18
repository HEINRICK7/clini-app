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

const actionLabels: Record<ToothAction, { label: string; helper: string }> = {
  CONDITION: { label: "Condição", helper: "Registrar algo observado neste dente" },
  PROCEDURE: { label: "Procedimento", helper: "Registrar algo realizado" },
  PLANNING: { label: "Planejamento", helper: "Adicionar uma próxima etapa" },
  NOTE: { label: "Observação", helper: "Guardar uma informação complementar" },
};

export function ToothActionMenu({ action, onActionChange, procedures, treatments, input, onInputChange, onSubmit, disabled }: {
  action: ToothAction | null;
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

  return <div className="grid gap-4">
    <div className="grid grid-cols-2 gap-2" aria-label="Ações rápidas do dente">
      {(Object.keys(actionLabels) as ToothAction[]).map((item) => <button className={`min-h-12 rounded-xl border px-3 text-left transition ${action === item ? "border-primary bg-primary text-white shadow-sm" : "border-border bg-surface text-foreground hover:border-primary/50"}`} key={item} onClick={() => onActionChange(item)} type="button"><span className="block text-sm font-bold">+ {actionLabels[item].label}</span><span className={`mt-0.5 block text-[11px] leading-4 ${action === item ? "text-blue-100" : "text-muted-foreground"}`}>{actionLabels[item].helper}</span></button>)}
    </div>
    {action ? <div className="rounded-2xl border border-primary/20 bg-blue-50/50 p-3"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-bold text-primary">Novo registro · {actionLabels[action].label}</p><span className="text-xs text-muted-foreground">Você pode escolher outra ação acima</span></div>
      {action === "PROCEDURE" ? <label className="grid gap-1.5 text-sm font-semibold"><span>Procedimento realizado</span><select className="min-h-11 rounded-xl border border-border bg-surface px-3 font-normal" onChange={(event) => onInputChange({ ...input, procedureId: event.target.value })} value={input.procedureId ?? ""}><option value="">Selecione</option>{procedures.map((procedure) => <option key={procedure.id} value={procedure.id}>{procedure.name}</option>)}</select></label> : null}
      {action === "PLANNING" ? <label className="grid gap-1.5 text-sm font-semibold"><span>Item do tratamento</span><select className="min-h-11 rounded-xl border border-border bg-surface px-3 font-normal" onChange={(event) => onInputChange({ ...input, planItemId: event.target.value })} value={input.planItemId ?? ""}><option value="">Selecione</option>{planned.map(({ treatment, item }) => <option key={item.id} value={item.id}>{treatment.name} · {item.name}</option>)}</select></label> : null}
      {action !== "NOTE" ? <label className="mt-3 grid gap-1.5 text-sm font-semibold"><span>Status</span><select className="min-h-11 rounded-xl border border-border bg-surface px-3 font-normal" onChange={(event) => onInputChange({ ...input, status: (event.target.value || undefined) as ToothRecordStatus | undefined })} value={input.status ?? ""}><option value="">{action === "PROCEDURE" ? "Concluído" : "Aberto"}</option><option value="OPEN">Aberto</option><option value="IN_PROGRESS">Em andamento</option><option value="COMPLETED">Concluído</option><option value="CANCELED">Cancelado</option></select></label> : null}
      <label className="mt-3 grid gap-1.5 text-sm font-semibold"><span>{action === "NOTE" ? "Observação clínica" : "Descrição (opcional)"}</span><textarea className="min-h-20 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-normal" maxLength={2000} onChange={(event) => onInputChange({ ...input, description: event.target.value })} placeholder={action === "NOTE" ? "Escreva uma observação para este dente" : "Descreva o registro clínico"} value={input.description} /></label>
      <button className="mt-3 min-h-11 w-full rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm disabled:opacity-50" disabled={disabled || (action === "PROCEDURE" && !input.procedureId) || (action === "PLANNING" && !input.planItemId) || (action === "NOTE" && !input.description.trim())} onClick={onSubmit} type="button">{disabled ? "Salvando…" : `Salvar ${actionLabels[action].label.toLowerCase()}`}</button>
    </div> : <p className="rounded-xl bg-surface-muted px-3 py-3 text-sm leading-5 text-muted-foreground">Escolha uma das quatro ações para registrar algo diretamente neste dente.</p>}
  </div>;
}
