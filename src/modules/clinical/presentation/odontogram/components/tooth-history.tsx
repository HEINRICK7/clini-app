"use client";

import type { ToothRecord } from "@/modules/clinical/odontogram-api";

const typeLabels: Record<ToothRecord["type"], string> = {
  CONDITION: "Condição",
  PROCEDURE: "Procedimento",
  PLANNING: "Planejamento",
  NOTE: "Anotação",
};

export function ToothHistory({ records, loading }: { records: ToothRecord[]; loading?: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Carregando histórico…</p>;
  if (!records.length) return <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">Nenhum registro neste dente ainda.</p>;
  return <ol className="grid gap-3" aria-label="Histórico do dente">
    {records.map((record) => <li className="rounded-xl border border-border bg-surface-muted p-3" key={record.id}>
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-primary">
        <span>{typeLabels[record.type]}</span>
        <time dateTime={record.createdAt}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(record.createdAt))}</time>
      </div>
      {record.description ? <p className="mt-1 text-sm leading-5 text-foreground">{record.description}</p> : null}
      {record.status ? <span className="mt-2 inline-flex rounded-full bg-surface px-2 py-1 text-xs text-muted-foreground">{record.status === "IN_PROGRESS" ? "Em andamento" : record.status === "OPEN" ? "Aberto" : record.status === "COMPLETED" ? "Concluído" : "Cancelado"}</span> : null}
    </li>)}
  </ol>;
}
