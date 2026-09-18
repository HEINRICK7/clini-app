"use client";

import Link from "next/link";

import type { ToothRecord } from "@/modules/clinical/odontogram-api";

const typeLabels: Record<ToothRecord["type"], string> = {
  CONDITION: "Condição",
  PROCEDURE: "Procedimento",
  PLANNING: "Planejamento",
  NOTE: "Observação",
};

function statusLabel(status: ToothRecord["status"]) {
  if (status === "IN_PROGRESS") return "Em andamento";
  if (status === "OPEN") return "Aberto";
  if (status === "COMPLETED") return "Concluído";
  if (status === "CANCELED") return "Cancelado";
  return null;
}

export function ToothHistory({ records, loading, patientId }: { records: ToothRecord[]; loading?: boolean; patientId: string }) {
  if (loading) return <p className="text-sm text-muted-foreground">Carregando histórico…</p>;
  if (!records.length) return <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">Nenhum registro neste dente ainda.</p>;
  return <ol className="grid gap-3" aria-label="Histórico cronológico do dente">
    {records.map((record) => <li className="relative rounded-xl border border-border bg-surface-muted p-3" key={record.id}>
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-primary"><span>{typeLabels[record.type]}</span><time dateTime={record.createdAt}>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(record.createdAt))}</time></div>
      <p className="mt-1 text-sm leading-5 text-foreground">{record.description || `${typeLabels[record.type]} registrada`}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">{statusLabel(record.status) ? <span className="rounded-full bg-surface px-2 py-1 text-xs text-muted-foreground">{statusLabel(record.status)}</span> : null}{record.appointmentId ? <Link className="text-xs font-semibold text-primary underline-offset-2 hover:underline" href={`/appointments/start?appointmentId=${record.appointmentId}&patientId=${patientId}`}>Atendimento de origem →</Link> : null}</div>
    </li>)}
  </ol>;
}
