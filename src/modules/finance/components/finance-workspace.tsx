"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RelatedSelect, relatedSelectDefaults } from "@/components/ui/related-select";
import { apiErrorMessage, isUnauthorized } from "@/lib/error-policy";
import type { FinancialEntry, PaymentMethod, FinancialStatus, FinancialType } from "@/app/services";
import { formatMoney, parseMoney, today } from "@/modules/finance/application/money";

export function FinanceWorkspace() {
  const { finance, patient, practice } = useCliniServices();
  const queryClient = useQueryClient();
  const [type, setType] = useState<FinancialType>("INCOME");
  const [status, setStatus] = useState<FinancialStatus | "">("");
  const [entryUnitId, setEntryUnitId] = useState("");
  const [entryPatientId, setEntryPatientId] = useState("");
  const [filterUnitId, setFilterUnitId] = useState("");
  const [filterPatientId, setFilterPatientId] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredOn, setOccurredOn] = useState(today());
  const [dueOn, setDueOn] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [paymentReference, setPaymentReference] = useState("");
  const [entryPage, setEntryPage] = useState(0);
  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: practice.listUnits, retry: false });
  const patientsQuery = useQuery({ queryKey: ["patients", "finance"], queryFn: () => patient.listPatients(), retry: false });
  const units = useMemo(() => (unitsQuery.data ?? []).filter((unit) => unit.status === "ACTIVE"), [unitsQuery.data]);
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const filters = { status: status || undefined, unitId: filterUnitId || undefined, patientId: filterPatientId || undefined };
  const entriesQuery = useQuery({ queryKey: ["finance-entries", filters, entryPage], queryFn: () => finance.listFinancialEntries({ ...filters, page: entryPage }), retry: false });
  const summaryQuery = useQuery({ queryKey: ["finance-summary", filterUnitId], queryFn: () => finance.getFinancialSummary({ unitId: filterUnitId || undefined }), retry: false });
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ["finance-entries"] }), queryClient.invalidateQueries({ queryKey: ["finance-summary"] })]); };
  const mutationError = (error: unknown) => setMessage(apiErrorMessage(error, "Não foi possível concluir a operação financeira."));
  const createMutation = useMutation({
    mutationFn: () => finance.createFinancialEntry({ type, description, notes: notes || undefined, amountCents: parseMoney(amount), occurredOn, dueOn: dueOn || undefined, unitId: entryUnitId || undefined, patientId: entryPatientId || undefined }),
    onSuccess: async () => { setDescription(""); setNotes(""); setAmount(""); setDueOn(""); setMessage("Lançamento criado em aberto."); await refresh(); }, onError: mutationError,
  });
  const settleMutation = useMutation({ mutationFn: (id: string) => finance.settleFinancialEntry(id, paymentMethod, paymentReference), onSuccess: async () => { setPaymentReference(""); setMessage("Lançamento liquidado."); await refresh(); }, onError: mutationError });
  const cancelMutation = useMutation({ mutationFn: (entry: FinancialEntry) => finance.cancelFinancialEntry(entry.id, cancelReason), onSuccess: async () => { setCancelReason(""); setMessage("Lançamento cancelado e preservado."); await refresh(); }, onError: mutationError });
  const busy = createMutation.isPending || settleMutation.isPending || cancelMutation.isPending;

  if (entriesQuery.isError && isUnauthorized(entriesQuery.error)) {
    return <Card className="p-5"><h2 className="text-lg font-bold">Financeiro</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre como dentista proprietário para acessar o financeiro.</p></Card>;
  }
  if (entriesQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar o financeiro.</p></Card>;
  const summary = summaryQuery.data;
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
    <Card className="p-5 sm:p-6">
      <p className="text-sm font-semibold text-primary">Tenant · somente OWNER</p><h2 className="mt-1 text-xl font-bold tracking-tight">Financeiro</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Controle receitas e despesas do dentista, consolidadas entre todas as Units.</p>
      <div className="mt-5 grid gap-3">
        <FinanceSelect label="Tipo" value={type} onChange={(value) => setType(value as FinancialType)} options={[{ value: "INCOME", label: "Receita" }, { value: "EXPENSE", label: "Despesa" }]} />
        <FinanceField label="Descrição" value={description} onChange={setDescription} placeholder="Ex.: Consulta de avaliação" />
        <div className="grid gap-3 sm:grid-cols-2"><FinanceField label="Valor (R$)" value={amount} onChange={setAmount} placeholder="189,90" /><FinanceField label="Data" type="date" value={occurredOn} onChange={setOccurredOn} /></div>
        <div className="grid gap-3 sm:grid-cols-2"><FinanceField label="Vencimento (opcional)" type="date" value={dueOn} onChange={setDueOn} /><FinanceSelect label="Unit (opcional)" value={entryUnitId} onChange={setEntryUnitId} options={units.map((unit) => ({ value: unit.id, label: unit.name }))} /></div>
        <FinanceSelect label="Patient (opcional)" value={entryPatientId} onChange={setEntryPatientId} options={patients.map((patient) => ({ value: patient.id, label: patient.fullName }))} />
        <label className="grid gap-1.5 text-sm font-semibold"><span>Observações (opcional)</span><textarea className="min-h-20 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal" onChange={(event) => setNotes(event.target.value)} placeholder="Contexto do lançamento" value={notes} /></label>
        <Button disabled={busy || !description.trim() || !amount.trim() || !occurredOn || parseMoney(amount) < 1} onClick={() => createMutation.mutate()}>{createMutation.isPending ? "Salvando…" : "Adicionar lançamento"}</Button>
        {message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}
      </div>
    </Card>
    <Card className="p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Consolidado do Tenant</p><h2 className="mt-1 text-xl font-bold tracking-tight">Visão financeira</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{summary?.totalItems ?? 0} lançamentos</span></div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Receitas", summary?.incomeCents ?? 0, "text-success"], ["Despesas", summary?.expenseCents ?? 0, "text-danger"], ["Saldo", summary?.balanceCents ?? 0, (summary?.balanceCents ?? 0) >= 0 ? "text-success" : "text-danger"], ["Em aberto", (summary?.openIncomeCents ?? 0) - (summary?.openExpenseCents ?? 0), "text-primary"]].map(([label, cents, color]) => <div className="rounded-xl bg-surface-muted p-3" key={label as string}><p className="text-[11px] font-semibold text-muted-foreground">{label}</p><p className={`mt-1 text-sm font-bold ${color}`}>{formatMoney(cents as number)}</p></div>)}</div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3"><FinanceSelect label="Filtrar status" value={status} onChange={(value) => { setStatus(value as FinancialStatus | ""); setEntryPage(0); }} options={[{ value: "", label: "Todos" }, { value: "OPEN", label: "Em aberto" }, { value: "SETTLED", label: "Liquidados" }, { value: "CANCELED", label: "Cancelados" }]} /><FinanceSelect label="Filtrar Unit" value={filterUnitId} onChange={(value) => { setFilterUnitId(value); setEntryPage(0); }} options={units.map((unit) => ({ value: unit.id, label: unit.name }))} /><FinanceSelect label="Patient" value={filterPatientId} onChange={(value) => { setFilterPatientId(value); setEntryPage(0); }} options={patients.map((patient) => ({ value: patient.id, label: patient.fullName }))} /></div>
      <div className="mt-3 grid gap-3 rounded-xl border border-border bg-surface-muted p-3 sm:grid-cols-[auto_1fr]"><FinanceSelect label="Forma ao liquidar" value={paymentMethod} onChange={(value) => setPaymentMethod(value as PaymentMethod)} options={[{ value: "CASH", label: "Dinheiro" }, { value: "PIX", label: "PIX" }, { value: "CARD", label: "Cartão" }, { value: "BANK_TRANSFER", label: "Transferência" }, { value: "OTHER", label: "Outra" }]} /><FinanceField label="Referência (opcional)" value={paymentReference} onChange={setPaymentReference} placeholder="Ex.: comprovante ou NSU" /></div>
      <div className="mt-4 grid gap-3">{entriesQuery.isPending ? <p className="text-sm text-muted-foreground">Carregando lançamentos…</p> : null}{!entriesQuery.isPending && !entriesQuery.data?.items.length ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhum lançamento para os filtros atuais.</p> : null}{entriesQuery.data?.items.map((entry) => <FinancialEntryCard busy={busy} cancelReason={cancelReason} entry={entry} key={entry.id} onCancel={() => cancelMutation.mutate(entry)} onCancelReason={setCancelReason} onSettle={() => settleMutation.mutate(entry.id)} />)}{entriesQuery.data && entriesQuery.data.totalPages > 1 ? <nav aria-label="Paginação de lançamentos" className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Página {entryPage + 1} de {entriesQuery.data.totalPages} · {entriesQuery.data.totalItems} lançamento(s)</p><div className="flex gap-2"><Button disabled={entryPage === 0 || entriesQuery.isFetching} onClick={() => setEntryPage((current) => current - 1)} size="sm" variant="outline">Anterior</Button><Button disabled={entryPage + 1 >= entriesQuery.data.totalPages || entriesQuery.isFetching} onClick={() => setEntryPage((current) => current + 1)} size="sm" variant="outline">Próxima</Button></div></nav> : null}</div>
    </Card>
  </section>;
}

function FinancialEntryCard({ entry, busy, cancelReason, onCancelReason, onCancel, onSettle }: { entry: FinancialEntry; busy: boolean; cancelReason: string; onCancelReason: (value: string) => void; onCancel: () => void; onSettle: () => void }) {
  return <article className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{entry.type === "INCOME" ? "Receita" : "Despesa"} · {entry.occurredOn}</p><h3 className="mt-1 font-bold">{entry.description}</h3></div><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${entry.status === "SETTLED" ? "bg-green-50 text-success" : entry.status === "CANCELED" ? "bg-surface-muted text-muted-foreground" : "bg-amber-50 text-amber-700"}`}>{entry.status === "SETTLED" ? "Liquidado" : entry.status === "CANCELED" ? "Cancelado" : "Em aberto"}</span></div><p className={`mt-3 text-lg font-bold ${entry.type === "INCOME" ? "text-success" : "text-danger"}`}>{entry.type === "INCOME" ? "+" : "−"}{formatMoney(entry.amountCents)}</p>{entry.notes ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{entry.notes}</p> : null}{entry.status === "OPEN" ? <div className="mt-3 grid gap-2 sm:grid-cols-[auto_auto_1fr]"><Button disabled={busy} onClick={onSettle} size="sm" variant="outline">Liquidar hoje</Button><Button disabled={busy || !cancelReason.trim()} onClick={onCancel} size="sm" variant="ghost">Cancelar</Button><input className="min-h-11 rounded-xl border border-border px-3 text-sm" onChange={(event) => onCancelReason(event.target.value)} placeholder="Motivo para cancelar" value={cancelReason} /></div> : null}</article>;
}

function FinanceSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <RelatedSelect {...relatedSelectDefaults(label)} label={label} onChange={onChange} options={options} value={value} />; }
function FinanceField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><input className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} value={value} /></label>; }
