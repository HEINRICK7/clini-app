"use client";

import { useQuery } from "@tanstack/react-query";

import { useCliniServices } from "@/app/service-container";
import { Card } from "@/components/ui/card";
import { isUnauthorized } from "@/lib/error-policy";

export function AuditWorkspace() {
  const { audit } = useCliniServices();
  const auditQuery = useQuery({ queryKey: ["audit-events"], queryFn: audit.listAuditEvents, retry: false });
  if (auditQuery.isError && isUnauthorized(auditQuery.error)) {
    return <Card className="p-5"><h2 className="text-lg font-bold">Auditoria</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre para consultar a trilha de auditoria.</p></Card>;
  }
  if (auditQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar a auditoria.</p></Card>;
  const entries = auditQuery.data?.items ?? [];
  return <Card className="p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Somente OWNER</p><h2 className="mt-1 text-xl font-bold tracking-tight">Auditoria do Tenant</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{auditQuery.data?.totalItems ?? 0}</span></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Ações sensíveis permanecem rastreáveis sem alterar o histórico original.</p><div className="mt-4 grid gap-2">{auditQuery.isPending ? <p className="text-sm text-muted-foreground">Carregando auditoria…</p> : null}{!auditQuery.isPending && !entries.length ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhum evento registrado.</p> : null}{entries.map((entry) => <article className="rounded-xl border border-border px-3 py-3" key={entry.id}><div className="flex items-start justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-primary">{entry.action}</p><time className="text-xs text-muted-foreground">{new Date(entry.occurredAt).toLocaleString("pt-BR")}</time></div><p className="mt-1 text-sm font-semibold">{entry.resourceType}</p>{entry.details ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{entry.details}</p> : null}</article>)}</div></Card>;
}
