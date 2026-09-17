"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Plus, Search, X } from "lucide-react";

import { useCliniServices } from "@/app/service-container";
import type { Patient, PatientDraft } from "@/app/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { apiErrorMessage, apiErrorProblem, isApiError, isUnauthorized } from "@/lib/error-policy";

const initialDraft: PatientDraft = { currentUnitId: "", fullName: "" };

export function PatientWorkspace() {
  const { patient: patientService, practice, privacy } = useCliniServices();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [patientPage, setPatientPage] = useState(0);
  const [draft, setDraft] = useState<PatientDraft>(initialDraft);
  const [filter, setFilter] = useState<"all" | "in-treatment" | "return">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<Patient[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: practice.listUnits, retry: false });
  const patientsQuery = useQuery({ queryKey: ["patients", search, patientPage], queryFn: () => patientService.listPatients(search, patientPage), retry: false });
  const activeUnits = useMemo(() => (unitsQuery.data ?? []).filter((unit) => unit.status === "ACTIVE"), [unitsQuery.data]);

  const refreshPatients = () => queryClient.invalidateQueries({ queryKey: ["patients"] });
  const createMutation = useMutation({
    mutationFn: patientService.createPatient,
    onSuccess: async () => {
      setDraft({ ...initialDraft, currentUnitId: activeUnits[0]?.id ?? "" });
      setDuplicateMatches([]);
      setMessage("Paciente cadastrado com sucesso.");
      await refreshPatients();
    },
    onError: (error) => {
      const matches = getPossibleMatches(error);
      setDuplicateMatches(matches);
      setMessage(matches.length ? "Revise os possíveis pacientes antes de continuar." : getErrorMessage(error));
    },
  });
  const transferMutation = useMutation({
    mutationFn: ({ patientId, targetUnitId }: { patientId: string; targetUnitId: string }) => patientService.transferPatient(patientId, targetUnitId, "Transferência realizada pelo OWNER"),
    onSuccess: async () => { setMessage("Paciente transferido sem apagar o histórico."); await refreshPatients(); },
    onError: (error) => setMessage(getErrorMessage(error)),
  });
  const archiveMutation = useMutation({
    mutationFn: patientService.archivePatient,
    onSuccess: async () => { setMessage("Paciente arquivado. O histórico foi preservado."); await refreshPatients(); },
    onError: (error) => setMessage(getErrorMessage(error)),
  });

  function changeDraft(field: keyof PatientDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setDuplicateMatches([]);
    setMessage(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>, confirm = false) {
    event.preventDefault();
    setMessage(null);
    createMutation.mutate({ ...draft, confirmPossibleDuplicate: confirm });
  }

  if (patientsQuery.isError && isUnauthorized(patientsQuery.error)) {
    return <Card className="p-5"><h2 className="text-lg font-bold">Pacientes</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre como dentista proprietário para acessar seus pacientes.</p></Card>;
  }

  if (patientsQuery.isError) {
    return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar os pacientes.</p></Card>;
  }

  const patients = patientsQuery.data?.items ?? [];
  const busy = createMutation.isPending || transferMutation.isPending || archiveMutation.isPending;

  return (
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Sua base de pacientes</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-navy">Pacientes</h1></div><Button aria-label="Adicionar paciente" className="h-12 w-12 shrink-0 rounded-full px-0 shadow-md" onClick={() => setShowCreate((current) => !current)}><Plus aria-hidden="true" className="h-5 w-5" /></Button></div>
      <label className="relative block"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Buscar pacientes" className="min-h-12 w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" onChange={(event) => { setSearch(event.target.value); setPatientPage(0); }} placeholder="Buscar paciente…" value={search} /></label>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Filtros de pacientes">{([["all", "Todos"], ["in-treatment", "Em atendimento"], ["return", "Retorno"]] as const).map(([value, label]) => <button aria-selected={filter === value} className={`min-h-10 rounded-xl border px-2 text-xs font-semibold transition-colors ${filter === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground hover:bg-surface-muted"}`} key={value} onClick={() => setFilter(value)} role="tab" type="button">{label}</button>)}</div>
      {showCreate ? <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Novo paciente</p><h2 className="mt-1 text-xl font-bold tracking-tight">Cadastrar paciente</h2></div><Button aria-label="Fechar cadastro de paciente" className="h-10 w-10 px-0" onClick={() => setShowCreate(false)} size="sm" variant="ghost"><X aria-hidden="true" className="h-5 w-5" /></Button></div>
        <p className="text-sm font-semibold text-primary">Cadastro seguro</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">O paciente é único no seu Tenant e começa vinculado a uma Unit.</p>
        <form className="mt-5 grid gap-3" onSubmit={submit}>
          <label className="grid gap-1.5 text-sm font-semibold"><span>Unit atual *</span><select className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal" onChange={(event) => changeDraft("currentUnitId", event.target.value)} required value={draft.currentUnitId}><option value="">Selecione</option>{activeUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}{unit.primary ? " · Principal" : ""}</option>)}</select></label>
          <PatientField label="Nome completo" required value={draft.fullName} onChange={(value) => changeDraft("fullName", value)} />
          <div className="grid gap-3 sm:grid-cols-2"><PatientField label="Nascimento" type="date" value={draft.dateOfBirth ?? ""} onChange={(value) => changeDraft("dateOfBirth", value)} /><PatientField label="CPF" value={draft.cpf ?? ""} onChange={(value) => changeDraft("cpf", value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2"><PatientField label="Telefone" value={draft.phone ?? ""} onChange={(value) => changeDraft("phone", value)} /><PatientField label="Email (opcional)" type="email" value={draft.email ?? ""} onChange={(value) => changeDraft("email", value)} /></div>
          <PatientField label="Endereço" value={draft.address ?? ""} onChange={(value) => changeDraft("address", value)} />
          {message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}
          {duplicateMatches.length ? <DuplicateNotice matches={duplicateMatches} onConfirm={() => createMutation.mutate({ ...draft, confirmPossibleDuplicate: true })} /> : null}
          <Button disabled={busy || !draft.currentUnitId || !draft.fullName.trim()} type="submit">{createMutation.isPending ? "Verificando…" : "Cadastrar paciente"}</Button>
        </form>
      </Card> : null}

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Lista de pacientes</p><h2 className="mt-1 text-xl font-bold tracking-tight">Seus pacientes</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{patientsQuery.data?.totalItems ?? patients.length}</span></div>
        <div className="mt-4 grid gap-3">
          {patientsQuery.isPending ? <p className="text-sm text-muted-foreground">Buscando pacientes…</p> : null}
          {!patientsQuery.isPending && patients.length === 0 ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm leading-6 text-muted-foreground">Nenhum paciente encontrado.</p> : null}
          {patients.map((patient) => <PatientCard key={patient.id} patient={patient} units={activeUnits} busy={busy} onTransfer={(targetUnitId) => transferMutation.mutate({ patientId: patient.id, targetUnitId })} onArchive={() => archiveMutation.mutate(patient.id)} onExport={() => exportPatientData(patient.id, privacy.downloadPatientDataExport)} />)}
          {patientsQuery.data && patientsQuery.data.totalPages > 1 ? <nav aria-label="Paginação de pacientes" className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Página {patientPage + 1} de {patientsQuery.data.totalPages} · {patientsQuery.data.totalItems} paciente(s)</p><div className="flex gap-2"><Button disabled={patientPage === 0 || patientsQuery.isFetching} onClick={() => setPatientPage((current) => current - 1)} size="sm" variant="outline">Anterior</Button><Button disabled={patientPage + 1 >= patientsQuery.data.totalPages || patientsQuery.isFetching} onClick={() => setPatientPage((current) => current + 1)} size="sm" variant="outline">Próxima</Button></div></nav> : null}
        </div>
      </Card>
    </section>
  );
}

async function exportPatientData(patientId: string, download: (patientId: string) => Promise<Blob>) {
  const blob = await download(patientId);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `clini-patient-${patientId}-data.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function PatientCard({ patient, units, busy, onTransfer, onArchive, onExport }: { patient: Patient; units: { id: string; name: string }[]; busy: boolean; onTransfer: (unitId: string) => void; onArchive: () => void; onExport: () => Promise<void> }) {
  return <article className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><Link className="flex min-w-0 flex-1 items-start gap-3" href={`/patients/${patient.id}`}><UserAvatar decorative name={patient.fullName} seed={patient.id || patient.email || patient.fullName} size="md" /><span className="min-w-0"><h3 className="truncate font-bold text-brand-navy">{patient.fullName}</h3><p className="mt-1 text-sm text-muted-foreground">{patient.phone ?? "Sem telefone"}{patient.provisional ? " · Cadastro provisório" : ""}</p></span><ChevronRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></Link><span className={patient.status === "ACTIVE" ? "rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-success" : "rounded-full bg-surface-muted px-2 py-1 text-xs font-bold text-muted-foreground"}>{patient.status === "ACTIVE" ? "Ativo" : "Arquivado"}</span></div><div className="mt-3 flex flex-wrap items-center gap-2">{patient.status === "ACTIVE" && units.length > 1 ? <select aria-label={`Transferir ${patient.fullName}`} className="min-h-10 rounded-xl border border-border bg-surface px-3 text-xs" defaultValue="" disabled={busy} onChange={(event) => { if (event.target.value) onTransfer(event.target.value); }}><option value="">Transferir para…</option>{units.filter((unit) => unit.id !== patient.currentUnitId).map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}</select> : null}<Button disabled={busy} onClick={() => void onExport()} size="sm" variant="outline">Exportar dados</Button>{patient.status === "ACTIVE" ? <Button disabled={busy} onClick={onArchive} size="sm" variant="ghost">Arquivar</Button> : null}</div></article>;
}

function PatientField({ label, required = false, type = "text", value, onChange }: { label: string; required?: boolean; type?: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}{required ? " *" : ""}</span><input className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} required={required} type={type} value={value} /></label>;
}

function DuplicateNotice({ matches, onConfirm }: { matches: Patient[]; onConfirm: () => void }) {
  return <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-bold">Possível duplicidade</p><p className="mt-1 leading-5">Encontramos {matches.length} paciente(s) parecido(s). Revise antes de confirmar.</p><ul className="mt-2 list-disc pl-5">{matches.map((patient) => <li key={patient.id}>{patient.fullName}{patient.phone ? ` · ${patient.phone}` : ""}</li>)}</ul><Button className="mt-3" onClick={onConfirm} size="sm" variant="outline">Cadastrar mesmo assim</Button></div>;
}

function getPossibleMatches(error: unknown): Patient[] {
  const problem = apiErrorProblem(error);
  if (!isApiError(error) || error.status !== 409 || !problem?.possibleMatches) return [];
  return problem.possibleMatches.flatMap((match) => { const parsed = match as Partial<Patient>; return typeof parsed.id === "string" && typeof parsed.fullName === "string" ? [match as Patient] : []; });
}

function getErrorMessage(error: unknown) {
  return apiErrorMessage(error, "Não foi possível concluir a operação.");
}
