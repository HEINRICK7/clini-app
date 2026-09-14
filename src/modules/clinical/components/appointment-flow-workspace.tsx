"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Circle, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { createClinicalEvolution } from "@/modules/clinical/api";
import { listCatalogProcedures } from "@/modules/catalog/api";
import { listPatients, type Patient } from "@/modules/patient/api";

type FlowStep = 1 | 2 | 3 | 4;
type NextStep = "completed" | "return" | "continue";

const stepLabels = ["Motivo / contexto", "Procedimentos", "Observações", "Próximo passo"] as const;

export function AppointmentFlowWorkspace() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<FlowStep>(1);
  const [patientId, setPatientId] = useState(searchParams.get("patientId") ?? "");
  const [context, setContext] = useState("");
  const [observations, setObservations] = useState("");
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([]);
  const [nextStep, setNextStep] = useState<NextStep>("return");
  const [returnDays, setReturnDays] = useState("30");
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "appointment-flow"], queryFn: () => listPatients(), retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const patient = patients.find((item) => item.id === patientId);
  const catalogQuery = useQuery({ queryKey: ["catalog-procedures", "appointment-flow", patient?.currentUnitId], queryFn: () => listCatalogProcedures({ unitId: patient?.currentUnitId }), enabled: Boolean(patient?.currentUnitId), retry: false });
  const finishMutation = useMutation({
    mutationFn: () => createClinicalEvolution({ patientId, unitId: patient?.currentUnitId ?? "", content: buildEvolutionContent({ context, observations, procedures: catalogQuery.data?.items.filter((item) => selectedProcedureIds.includes(item.id)).map((item) => item.name) ?? [], nextStep, returnDays }), appointmentId: searchParams.get("appointmentId") ?? undefined }),
    onSuccess: async () => {
      setMessage("Atendimento finalizado e salvo no prontuário.");
      await queryClient.invalidateQueries({ queryKey: ["clinical-evolutions", patientId] });
    },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Não foi possível finalizar o atendimento."),
  });

  function toggleProcedure(procedureId: string) {
    setSelectedProcedureIds((current) => current.includes(procedureId) ? current.filter((id) => id !== procedureId) : [...current, procedureId]);
  }

  function continueFlow() {
    setMessage(null);
    if (step < 4) setStep((current) => (current + 1) as FlowStep);
    else finishMutation.mutate();
  }

  return <section className="mx-auto grid w-full max-w-2xl gap-4">
    <div className="flex items-center gap-2"><Button aria-label="Voltar para pacientes" className="h-10 w-10 px-0" onClick={() => window.history.back()} size="sm" variant="ghost"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Atendimento</p><h1 className="text-xl font-bold tracking-tight text-brand-navy">Iniciar atendimento</h1></div></div>
    <PatientContext patient={patient} patients={patients} patientId={patientId} onPatientChange={setPatientId} />
    <Card className="p-4 sm:p-6"><div className="grid gap-2 sm:grid-cols-4" aria-label="Etapas do atendimento">{stepLabels.map((label, index) => { const itemStep = (index + 1) as FlowStep; const active = step === itemStep; const complete = step > itemStep; return <button aria-current={active ? "step" : undefined} className={`flex items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold sm:block sm:text-center ${active ? "bg-blue-50 text-primary" : complete ? "text-success" : "text-muted-foreground"}`} key={label} onClick={() => { if (complete) setStep(itemStep); }} type="button"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full sm:mx-auto sm:mb-1 ${active ? "bg-primary text-white" : complete ? "bg-green-100 text-success" : "bg-surface-muted"}`}>{complete ? <Check aria-hidden="true" className="h-4 w-4" /> : itemStep}</span><span>{label}</span></button>; })}</div></Card>
    {step === 1 ? <ContextStep context={context} onChange={setContext} /> : null}
    {step === 2 ? <ProceduresStep procedures={catalogQuery.data?.items ?? []} selectedIds={selectedProcedureIds} onToggle={toggleProcedure} isPending={catalogQuery.isPending} /> : null}
    {step === 3 ? <ObservationsStep observations={observations} onChange={setObservations} /> : null}
    {step === 4 ? <FinishStep nextStep={nextStep} returnDays={returnDays} onNextStep={setNextStep} onReturnDays={setReturnDays} /> : null}
    {message ? <p aria-live="polite" className={`rounded-xl px-4 py-3 text-sm ${finishMutation.isError ? "bg-danger/10 text-danger" : "bg-green-50 text-success"}`}>{message}</p> : null}
    <Button className="w-full" disabled={!patient || !context.trim() || finishMutation.isPending} onClick={continueFlow}>{finishMutation.isPending ? "Finalizando…" : step === 4 ? "Finalizar atendimento" : "Continuar"}</Button>
  </section>;
}

function PatientContext({ patient, patients, patientId, onPatientChange }: { patient?: Patient; patients: Patient[]; patientId: string; onPatientChange: (value: string) => void }) {
  return <Card className="p-4 sm:p-5"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-brand-navy">{patient ? patient.fullName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : <Circle aria-hidden="true" className="h-5 w-5" />}</span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-muted-foreground">Paciente</p>{patient ? <p className="truncate font-bold text-brand-navy">{patient.fullName}</p> : <label className="relative mt-1 block"><Search aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><select aria-label="Selecionar paciente" className="min-h-10 w-full appearance-none rounded-lg border border-border bg-surface pl-8 pr-2 text-sm font-semibold" onChange={(event) => onPatientChange(event.target.value)} value={patientId}><option value="">Buscar paciente…</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>}</div>{patient ? <p className="text-xs text-muted-foreground">{patient.phone ?? "Sem telefone"}</p> : null}</div></Card>;
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

function FinishStep({ nextStep, returnDays, onNextStep, onReturnDays }: { nextStep: NextStep; returnDays: string; onNextStep: (value: NextStep) => void; onReturnDays: (value: string) => void }) {
  return <Card className="p-5 sm:p-6"><p className="text-sm font-bold text-brand-navy">Qual o próximo passo?</p><div className="mt-4 grid gap-2">{([["completed", "Tratamento concluído"], ["return", "Precisa de retorno"], ["continue", "Continuar tratamento"]] as const).map(([value, label]) => { const selected = nextStep === value; return <button aria-pressed={selected} className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 text-left ${selected ? "border-primary bg-blue-50/50" : "border-border"}`} key={value} onClick={() => onNextStep(value)} type="button"><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-white" : "border-border"}`}>{selected ? <Check aria-hidden="true" className="h-3 w-3" /> : null}</span><span className="text-sm font-semibold">{label}</span></button>; })}</div>{nextStep === "return" ? <label className="mt-4 grid gap-1.5 text-sm font-semibold"><span>Em quantos dias?</span><div className="flex items-center gap-2"><input className="min-h-11 w-24 rounded-xl border border-border bg-surface px-3 text-sm" min="1" onChange={(event) => onReturnDays(event.target.value)} type="number" value={returnDays} /><span className="text-sm font-normal text-muted-foreground">dias</span></div></label> : null}</Card>;
}

function buildEvolutionContent({ context, observations, procedures, nextStep, returnDays }: { context: string; observations: string; procedures: string[]; nextStep: NextStep; returnDays: string }) {
  const nextLabel = nextStep === "completed" ? "Tratamento concluído" : nextStep === "continue" ? "Continuar tratamento" : `Retorno em ${returnDays || "30"} dias`;
  return [`Motivo / contexto:\n${context}`, procedures.length ? `Procedimentos:\n${procedures.map((procedure) => `- ${procedure}`).join("\n")}` : "Procedimentos:\nNenhum procedimento selecionado.", `Observações:\n${observations || "Nenhuma observação adicional."}`, `Próximo passo:\n${nextLabel}`].join("\n\n");
}
