"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { listUnits } from "@/modules/practice/api";
import {
  archiveCatalogProcedure,
  configureCatalogProcedure,
  createCatalogProcedure,
  listCatalogProcedures,
  updateCatalogProcedure,
  type CatalogProcedure,
} from "@/modules/catalog/api";

export function CatalogWorkspace() {
  const queryClient = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: listUnits, retry: false });
  const activeUnits = useMemo(() => (unitsQuery.data ?? []).filter((unit) => unit.status === "ACTIVE"), [unitsQuery.data]);
  const effectiveUnitId = unitId || activeUnits[0]?.id || "";
  const proceduresQuery = useQuery({
    queryKey: ["catalog-procedures", effectiveUnitId, query, includeArchived],
    queryFn: () => listCatalogProcedures({ unitId: effectiveUnitId || undefined, query, includeArchived }),
    retry: false,
  });
  const procedures = proceduresQuery.data?.items ?? [];
  const selected = procedures.find((item) => item.id === selectedId) ?? null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["catalog-procedures"] });
  const saveMutation = useMutation({
    mutationFn: () => selectedId
      ? updateCatalogProcedure(selectedId, { name, description: description || undefined })
      : createCatalogProcedure({ name, description: description || undefined }),
    onSuccess: async (procedure) => {
      setSelectedId(procedure.id);
      setName(procedure.name);
      setDescription(procedure.description ?? "");
      setMessage(selectedId ? "Procedimento atualizado." : "Procedimento criado.");
      await refresh();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });
  const configureMutation = useMutation({
    mutationFn: () => configureCatalogProcedure({
      procedureId: selectedId ?? "",
      unitId: effectiveUnitId,
      priceCents: parsePrice(price),
      durationMinutes: duration.trim() ? Number(duration) : null,
    }),
    onSuccess: async (procedure) => {
      setPrice(formatPrice(procedure.unitConfiguration?.priceCents));
      setDuration(procedure.unitConfiguration?.durationMinutes?.toString() ?? "");
      setMessage("Configuração da Unit salva.");
      await refresh();
    },
    onError: (error) => setMessage(errorMessage(error)),
  });
  const archiveMutation = useMutation({
    mutationFn: () => archiveCatalogProcedure(selectedId ?? ""),
    onSuccess: async () => { setMessage("Procedimento arquivado sem excluir o histórico."); await refresh(); },
    onError: (error) => setMessage(errorMessage(error)),
  });
  const busy = saveMutation.isPending || configureMutation.isPending || archiveMutation.isPending;

  function selectProcedure(procedure: CatalogProcedure) {
    setSelectedId(procedure.id);
    setName(procedure.name);
    setDescription(procedure.description ?? "");
    setPrice(formatPrice(procedure.unitConfiguration?.priceCents));
    setDuration(procedure.unitConfiguration?.durationMinutes?.toString() ?? "");
    setMessage(null);
  }

  if (proceduresQuery.isError && proceduresQuery.error instanceof ApiError && proceduresQuery.error.status === 401) {
    return <Card className="p-5"><h2 className="text-lg font-bold">Catálogo de procedimentos</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre como dentista proprietário para configurar procedimentos.</p></Card>;
  }
  if (proceduresQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar o catálogo.</p></Card>;

  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
    <Card className="p-5 sm:p-6">
      <p className="text-sm font-semibold text-primary">Tenant · somente OWNER</p>
      <h2 className="mt-1 text-xl font-bold tracking-tight">Catálogo de procedimentos</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Cadastre o procedimento uma vez e ajuste preço ou duração por Unit quando necessário.</p>
      <div className="mt-5 grid gap-3">
        <CatalogField label="Nome do procedimento" value={name} onChange={setName} placeholder="Ex.: Restauração em resina" />
        <label className="grid gap-1.5 text-sm font-semibold"><span>Descrição (opcional)</span><textarea className="min-h-24 rounded-xl border border-border bg-surface px-4 py-3 text-base font-normal outline-none focus:border-primary focus:ring-4 focus:ring-cyan-100" onChange={(event) => setDescription(event.target.value)} placeholder="Observações gerais do procedimento" value={description} /></label>
        <Button disabled={busy || !name.trim()} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? "Salvando…" : selectedId ? "Salvar procedimento" : "Adicionar procedimento"}</Button>
        {selected && selected.status === "ACTIVE" ? <>
          <div className="mt-2 border-t border-border pt-4"><p className="text-sm font-bold">Configuração por Unit</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Use centavos no backend para evitar erros de arredondamento. O campo abaixo aceita, por exemplo, 189,90.</p></div>
          <label className="grid gap-1.5 text-sm font-semibold"><span>Unit</span><select className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal" onChange={(event) => setUnitId(event.target.value)} value={effectiveUnitId}><option value="">Selecione</option>{activeUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select></label>
          <div className="grid gap-3 sm:grid-cols-2"><CatalogField label="Preço (R$)" value={price} onChange={setPrice} placeholder="189,90" /><CatalogField label="Duração (minutos)" value={duration} onChange={setDuration} placeholder="60" type="number" /></div>
          <Button disabled={busy || !effectiveUnitId || (!price.trim() && !duration.trim())} onClick={() => configureMutation.mutate()} size="sm" variant="outline">{configureMutation.isPending ? "Salvando…" : "Salvar na Unit"}</Button>
          <Button disabled={busy} onClick={() => archiveMutation.mutate()} size="sm" variant="ghost">Arquivar sem excluir</Button>
        </> : null}
        {message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}
      </div>
    </Card>
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-primary">Procedimentos reutilizáveis</p><h2 className="mt-1 text-xl font-bold tracking-tight">Catálogo do dentista</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{proceduresQuery.data?.totalItems ?? 0}</span></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><input aria-label="Buscar procedimentos" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-cyan-100" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar procedimento" value={query} /><label className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-xs font-semibold"><input checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} type="checkbox" /> Mostrar arquivados</label></div>
      <div className="mt-4 grid gap-3">{proceduresQuery.isPending ? <p className="text-sm text-muted-foreground">Carregando catálogo…</p> : null}{!proceduresQuery.isPending && !procedures.length ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm leading-6 text-muted-foreground">Nenhum procedimento cadastrado.</p> : null}{procedures.map((procedure) => <button className={`rounded-2xl border p-4 text-left ${selectedId === procedure.id ? "border-primary bg-cyan-50/30" : "border-border"}`} key={procedure.id} onClick={() => selectProcedure(procedure)} type="button"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{procedure.name}</h3>{procedure.description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{procedure.description}</p> : null}</div><span className={procedure.status === "ACTIVE" ? "rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-success" : "rounded-full bg-surface-muted px-2 py-1 text-xs font-bold text-muted-foreground"}>{procedure.status === "ACTIVE" ? "Ativo" : "Arquivado"}</span></div><p className="mt-3 text-xs text-muted-foreground">{procedure.unitConfiguration ? `${formatPrice(procedure.unitConfiguration.priceCents) || "Preço não informado"} · ${procedure.unitConfiguration.durationMinutes ? `${procedure.unitConfiguration.durationMinutes} min` : "Duração não informada"}` : "Sem configuração para a Unit selecionada"}</p></button>)}</div>
    </Card>
  </section>;

}

function CatalogField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><input className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal outline-none focus:border-primary focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></label>;
}

function parsePrice(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Não foi possível concluir a operação.";
}
