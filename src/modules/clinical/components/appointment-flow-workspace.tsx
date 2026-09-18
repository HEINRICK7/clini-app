"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Circle, Search } from "lucide-react";

import { useCliniServices } from "@/app/service-container";
import type { Patient } from "@/app/services";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { apiErrorMessage } from "@/lib/error-policy";
import { buildEvolutionContent, type NextStep } from "@/modules/clinical/application/appointment-rules";
import { addDays, instant, localDate } from "@/modules/scheduling/application/calendar-rules";
import { CliniOdontogram } from "@/modules/clinical/presentation/odontogram/components/clini-odontogram";

type FlowStep = 1 | 2 | 3 | 4 | 5;

const stepLabels = ["Motivo / contexto", "Procedimentos", "Odontograma", "Observações", "Próximo passo"] as const;

export function AppointmentFlowWorkspace() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { catalog, clinical, patient: patientService } = useCliniServices();
  const [step, setStep] = useState<FlowStep>(1);
  const [patientId, setPatientId] = useState(searchParams.get("patientId") ?? "");
  const [context, setContext] = useState("");
  const [observations, setObservations] = useState("");
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([]);
  const [nextStep, setNextStep] = useState<NextStep>("return");
  const [returnDays, setReturnDays] = useState("30");
  const [returnDate, setReturnDate] = useState(() => addDays(localDate(), 30));
  const [returnStart, setReturnStart] = useState("09:00");
  const [returnEnd, setReturnEnd] = useState("10:00");
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "appointment-flow"], queryFn: () => patientService.listPatients(), retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const patient = patients.find((item) => item.id === patientId);
  const catalogQuery = useQuery({ queryKey: ["catalog-procedures", "appointment-flow", patient?.currentUnitId], queryFn: () => catalog.listCatalogProcedures({ unitId: patient?.currentUnitId }), enabled: Boolean(patient?.currentUnitId), retry: false });
  const finishMutation = useMutation({
    mutationFn: () => clinical.completeAppointment({ patientId, unitId: patient?.currentUnitId ?? "", content: buildEvolutionContent({ context, observations, procedures: catalogQuery.data?.items.filter((item) => selectedProcedureIds.includes(item.id)).map((item) => item.name) ?? [], nextStep, returnDays }), appointmentId: searchParams.get("appointmentId") ?? undefined, nextStep, returnAppointment: nextStep === "return" ? { startsAt: instant(returnDate, returnStart), endsAt: instant(returnDate, returnEnd) } : undefined }),
    onSuccess: async (result) => {
      setMessage(result.returnAppointment ? "Atendimento concluído e retorno agendado." : "Atendimento concluído e evolução clínica fechada.");
      await queryClient.invalidateQueries({ queryKey: ["clinical-evolutions", patientId] });
      await queryClient.invalidateQueries({ queryKey: ["agenda"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível finalizar o atendimento.")),
  });

  function toggleProcedure(procedureId: string) {
    setSelectedProcedureIds((current) => current.includes(procedureId) ? current.filter((id) => id !== procedureId) : [...current, procedureId]);
  }

  function continueFlow() {
    setMessage(null);
    if (step < 4) setStep((current) => (current + 1) as FlowStep);
    else finishMutation.mutate();
  }

  function changeReturnDays(value: string) {
    setReturnDays(value);
    const days = Number(value);
    if (Number.isInteger(days) && days > 0) setReturnDate(addDays(localDate(), days));
  }

  const invalidReturn = nextStep === "return" && (!returnDate || !returnStart || !returnEnd || returnStart >= returnEnd);

  return <section className="mx-auto grid w-full max-w-2xl gap-4">
    <div className="flex items-center gap-2"><Button aria-label="Voltar para pacientes" className="h-10 w-10 px-0" onClick={() => window.history.back()} size="sm" variant="ghost"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Atendimento</p><h1 className="text-xl font-bold tracking-tight text-brand-navy">Iniciar atendimento</h1></div></div>
    <PatientContext patient={patient} patients={patients} patientId={patientId} onPatientChange={setPatientId} />
    <Card className="p-4 sm:p-6"><div className="grid gap-2 sm:grid-cols-4" aria-label="Etapas do atendimento">{stepLabels.map((label, index) => { const itemStep = (index + 1) as FlowStep; const active = step === itemStep; const complete = step > itemStep; return <button aria-current={active ? "step" : undefined} className={`flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold sm:block sm:text-center ${active ? "bg-blue-50 text-primary" : complete ? "text-success" : "text-muted-foreground"}`} key={label} onClick={() => { if (complete) setStep(itemStep); }} type="button"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:mx-auto sm:mb-1 ${active ? "bg-primary text-white" : complete ? "bg-green-100 text-success" : "bg-surface-muted"}`}>{complete ? <Check aria-hidden="true" className="h-4 w-4" /> : itemStep}</span><span>{label}</span></button>; })}</div></Card>
    {step === 1 ? <ContextStep context={context} onChange={setContext} /> : null}
    {step === 2 ? <ProceduresStep procedures={catalogQuery.data?.items ?? []} selectedIds={selectedProcedureIds} onToggle={toggleProcedure} isPending={catalogQuery.isPending} /> : null}
    {step === 3 ? patient ? <CliniOdontogram appointmentId={searchParams.get("appointmentId") ?? undefined} onFinishAppointment={() => setStep(5)} patientId={patient.id} unitId={patient.currentUnitId} /> : <Card className="p-5 text-sm text-muted-foreground">Selecione um paciente para abrir o odontograma.</Card> : null}
    {step === 4 ? <ObservationsStep observations={observations} onChange={setObservations} /> : null}
    {step === 5 ? <FinishStep nextStep={nextStep} returnDays={returnDays} returnDate={returnDate} returnStart={returnStart} returnEnd={returnEnd} onNextStep={setNextStep} onReturnDays={changeReturnDays} onReturnDate={setReturnDate} onReturnStart={setReturnStart} onReturnEnd={setReturnEnd} /> : null}
    {message ? <p aria-live="polite" className={`rounded-xl px-4 py-3 text-sm ${finishMutation.isError ? "bg-danger/10 text-danger" : "bg-green-50 text-success"}`}>{message}</p> : null}
    <Button className="w-full" disabled={!patient || !context.trim() || invalidReturn || finishMutation.isPending} onClick={continueFlow}>{finishMutation.isPending ? "Finalizando…" : step === 5 ? "Finalizar atendimento" : "Continuar"}</Button>
  </section>;
}

function PatientContext({ patient, patients, patientId, onPatientChange }: { patient?: Patient; patients: Patient[]; patientId: string; onPatientChange: (value: string) => void }) {
  return <Card className="p-4 sm:p-5"><div className="flex items-center gap-3">{patient ? <UserAvatar decorative name={patient.fullName} seed={patient.id || patient.email || patient.fullName} size="md" /> : <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted"><Circle className="h-5 w-5 text-muted-foreground" /></span>}<div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted-foreground">Paciente</p>{patient ? <p className="truncate font-bold text-brand-navy">{patient.fullName}</p> : <label className="relative mt-1 block"><Search aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select aria-label="Selecionar paciente" className="min-h-10 w-full appearance-none rounded-lg border border-border bg-surface pl-8 pr-2 text-sm font-semibold" onChange={(event) => onPatientChange(event.target.value)} value={patientId}><option value="">Buscar paciente…</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>}</div>{patient ? <p className="text-xs text-muted-foreground">{patient.phone ?? "Sem telefone"}</p> : null}</div></Card>;
}

function ContextStep({ context, onChange }: { context: string; onChange: (value: string) => void }) {
  return <Card className="p-5 sm:p-6"><div className="flex items-center gap-2 text-primary"><CheckCircle2 aria-hidden="true" className="h-5 w-5" /><p className="text-sm font-bold">Motivo / contexto</p></div><p className="mt-2 text-sm leading-6 text-muted-foreground">Registre o motivo da consulta e o contexto clínico observado.</p><textarea aria-label="Motivo e contexto" className="mt-5 min-h-40 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" onChange={(event) => onChange(event.target.value)} placeholder="Ex.: retorno para avaliação…" value={context} /></Card>;
}

function ProceduresStep({ procedures, selectedIds, onToggle, isPending }: { procedures: { id: string; name: string; description: string | null }[]; selectedIds: string[]; onToggle: (id: string) => void; isPending: boolean }) {
  return <Card className="p-5 sm:p-6"><p className="text-sm font-bold text-brand-navy">Procedimentos</p><p className="mt-2 text-sm text-muted-foreground">Selecione o que foi realizado ou discutido neste atendimento.</p>{isPending ? <p className="mt-5 text-sm text-muted-foreground">Carregando procedimentos…</p> : null}{!isPending && !procedures.length ? <p className="mt-5 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhum procedimento configurado para este local.</p> : null}<div className="mt-4 grid gap-2">{procedures.map((procedure) => { const selected = selectedIds.includes(procedure.id); return <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${selected ? "border-primary bg-blue-50/50 text-brand-navy" : "border-border"}`} key={procedure.id}><input checked={selected} className="h-4 w-4 accent-primary" onChange={() => onToggle(procedure.id)} type="checkbox" /><span className="flex-1"><span className="block font-semibold">{procedure.name}</span>{procedure.description ? <span className="mt-0.5 block text-xs text-muted-foreground">{procedure.description}</span> : null}</span></label>; })}</div></Card>;
}

function ObservationsStep({ observations, onChange }: { observations: string; onChange: (value: string) => void }) {
  return <Card className="p-5 sm:p-6"><p className="text-sm font-bold text-brand-navy">Observações</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Adicione orientações, achados e a conduta definida.</p><textarea aria-label="Observações do atendimento" className="mt-5 min-h-48 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" onChange={(event) => onChange(event.target.value)} placeholder="Escreva as observações do atendimento…" value={observations} /></Card>;
}

function FinishStep({ nextStep, returnDays, returnDate, returnStart, returnEnd, onNextStep, onReturnDays, onReturnDate, onReturnStart, onReturnEnd }: { nextStep: NextStep; returnDays: string; returnDate: string; returnStart: string; returnEnd: string; onNextStep: (value: NextStep) => void; onReturnDays: (value: string) => void; onReturnDate: (value: string) => void; onReturnStart: (value: string) => void; onReturnEnd: (value: string) => void }) {
  return <Card className="p-5 sm:p-6"><p className="text-sm font-bold text-brand-navy">Qual o próximo passo?</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Ao escolher retorno, o atendimento será fechado e o horário ficará reservado na agenda.</p><div className="mt-4 grid gap-2">{([["completed", "Tratamento concluído"], ["return", "Precisa de retorno"], ["continue", "Continuar tratamento"]] as const).map(([value, label]) => { const selected = nextStep === value; return <button aria-pressed={selected} className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left ${selected ? "border-primary bg-blue-50/50" : "border-border"}`} key={value} onClick={() => onNextStep(value)} type="button"><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>{selected ? <Check aria-hidden="true" className="h-3 w-3" /> : null}</span><span className="text-sm font-semibold">{label}</span></button>; })}</div>{nextStep === "return" ? <div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="grid gap-1.5 text-sm font-semibold sm:col-span-3"><span>Em quantos dias?</span><div className="flex items-center gap-2"><input aria-label="Dias até o retorno" className="min-h-11 w-24 rounded-xl border border-border bg-surface px-3 text-sm" min="1" onChange={(event) => onReturnDays(event.target.value)} type="number" value={returnDays} /><span className="text-sm font-normal text-muted-foreground">dias</span></div></label><label className="grid gap-1.5 text-sm font-semibold"><span>Data do retorno</span><input aria-label="Data do retorno" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm" min={localDate()} onChange={(event) => onReturnDate(event.target.value)} type="date" value={returnDate} /></label><label className="grid gap-1.5 text-sm font-semibold"><span>Início</span><input aria-label="Início do retorno" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm" onChange={(event) => onReturnStart(event.target.value)} type="time" value={returnStart} /></label><label className="grid gap-1.5 text-sm font-semibold"><span>Fim</span><input aria-label="Fim do retorno" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm" onChange={(event) => onReturnEnd(event.target.value)} type="time" value={returnEnd} /></label></div> : null}</Card>;
}
