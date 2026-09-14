"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, ClipboardPenLine, FileClock, Phone, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { listClinicalEvolutions, type ClinicalEvolution } from "@/modules/clinical/api";
import { listTreatments, type Treatment } from "@/modules/clinical/treatment-api";
import { listAgenda } from "@/modules/scheduling/api";
import { getPatient, updatePatient, type Patient } from "@/modules/patient/api";

type ProfileTab = "summary" | "history" | "treatments";

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + amount);
  return value.toISOString();
}

export function PatientProfileScreen({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProfileTab>("summary");
  const [editing, setEditing] = useState(false);
  const patientQuery = useQuery({ queryKey: ["patient", patientId], queryFn: () => getPatient(patientId), retry: false });
  const patient = patientQuery.data;
  const evolutionsQuery = useQuery({ queryKey: ["clinical-evolutions", patientId, "profile"], queryFn: () => listClinicalEvolutions(patientId), enabled: Boolean(patient), retry: false });
  const treatmentsQuery = useQuery({ queryKey: ["treatments", patientId, "profile"], queryFn: () => listTreatments(patientId), enabled: Boolean(patient), retry: false });
  const today = localDate();
  const agendaQuery = useQuery({ queryKey: ["agenda", "patient-profile", patientId], queryFn: () => listAgenda(`${today}T00:00:00.000Z`, addDays(today, 90), patient?.currentUnitId), enabled: Boolean(patient), retry: false });
  const updateMutation = useMutation({
    mutationFn: (input: PatientUpdateForm) => updatePatient(patientId, input),
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
    },
  });

  if (patientQuery.isPending) return <Card className="p-5"><p className="text-sm text-muted-foreground">Carregando perfil…</p></Card>;
  if (patientQuery.isError || !patient) return <Card className="p-5"><p className="text-sm font-semibold text-danger">Não foi possível carregar o perfil do paciente.</p><p className="mt-1 text-sm text-muted-foreground">{patientQuery.error instanceof ApiError ? patientQuery.error.message : "Tente novamente."}</p></Card>;

  const nextAppointment = agendaQuery.data?.appointments.find((appointment) => appointment.patientId === patient.id && appointment.status !== "CANCELED");
  const activeTreatment = treatmentsQuery.data?.items.find((treatment) => treatment.status === "ACTIVE");
  const initials = patient.fullName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <section className="mx-auto grid w-full max-w-2xl gap-4">
    <Link className="inline-flex min-h-10 w-fit items-center text-sm font-semibold text-primary hover:text-primary-strong" href="/patients">← Voltar para pacientes</Link>
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-muted text-lg font-bold text-brand-navy">{initials || <UserRound aria-hidden="true" className="h-6 w-6" />}</span><div className="min-w-0 flex-1"><h1 className="truncate text-xl font-bold tracking-tight text-brand-navy">{patient.fullName}</h1><p className="mt-1 text-sm text-muted-foreground">{patient.phone ?? "Sem telefone"}{patient.provisional ? " · Cadastro provisório" : ""}</p></div><span className={patient.status === "ACTIVE" ? "rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-success" : "rounded-full bg-surface-muted px-2 py-1 text-xs font-bold text-muted-foreground"}>{patient.status === "ACTIVE" ? "Ativo" : "Arquivado"}</span></div>
      <div className="mt-5 grid grid-cols-3 gap-2"><Link className="inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-border text-xs font-semibold text-brand-navy hover:bg-surface-muted" href={`/agenda?patientId=${patient.id}`}><CalendarPlus aria-hidden="true" className="h-4 w-4 text-primary" />Agendar</Link><Link className="inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-border text-xs font-semibold text-brand-navy hover:bg-surface-muted" href={`/appointments/start?patientId=${patient.id}`}><ClipboardPenLine aria-hidden="true" className="h-4 w-4 text-primary" />Atendimento</Link><a className="inline-flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl border border-border text-xs font-semibold text-brand-navy hover:bg-surface-muted" href={patient.phone ? `tel:${patient.phone}` : undefined}><Phone aria-hidden="true" className="h-4 w-4 text-primary" />Ligar</a></div>
      <div className="mt-5 grid grid-cols-3 rounded-xl bg-surface-muted p-1" role="tablist" aria-label="Seções do perfil do paciente">{([["summary", "Resumo"], ["history", "Histórico"], ["treatments", "Tratamentos"]] as const).map(([value, label]) => <button aria-selected={tab === value} className={`min-h-10 rounded-lg px-2 text-xs font-semibold transition-colors ${tab === value ? "bg-surface text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`} key={value} onClick={() => setTab(value)} role="tab" type="button">{label}</button>)}</div>
    </Card>
    {tab === "summary" ? <SummaryTab patient={patient} nextAppointment={nextAppointment} activeTreatment={activeTreatment} onEdit={() => setEditing(true)} /> : null}
    {tab === "history" ? <HistoryTab isPending={evolutionsQuery.isPending} items={evolutionsQuery.data?.items ?? []} /> : null}
    {tab === "treatments" ? <TreatmentsTab isPending={treatmentsQuery.isPending} items={treatmentsQuery.data?.items ?? []} /> : null}
    {editing ? <EditPatientForm patient={patient} busy={updateMutation.isPending} onCancel={() => setEditing(false)} onSave={(input) => updateMutation.mutate(input)} error={updateMutation.error} /> : null}
  </section>;
}

function SummaryTab({ patient, nextAppointment, activeTreatment, onEdit }: { patient: Patient; nextAppointment?: { startsAt: string; endsAt: string; type: string }; activeTreatment?: { name: string; status: string; plannedProcedures: { name: string }[] }; onEdit: () => void }) {
  return <div className="grid gap-3"><Card className="p-5"><div className="flex items-center gap-2 text-primary"><CalendarPlus aria-hidden="true" className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.14em]">Próxima consulta</p></div>{nextAppointment ? <><p className="mt-3 text-lg font-bold text-brand-navy">{new Date(nextAppointment.startsAt).toLocaleDateString("pt-BR")} · {new Date(nextAppointment.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p><p className="mt-1 text-sm text-muted-foreground">{appointmentTypeLabel(nextAppointment.type)}</p></> : <p className="mt-3 text-sm text-muted-foreground">Nenhuma consulta futura encontrada.</p>}</Card><Card className="p-5"><div className="flex items-center gap-2 text-primary"><FileClock aria-hidden="true" className="h-4 w-4" /><p className="text-xs font-bold uppercase tracking-[0.14em]">Tratamento atual</p></div>{activeTreatment ? <><p className="mt-3 font-bold text-brand-navy">{activeTreatment.name}</p><p className="mt-1 text-sm text-muted-foreground">{activeTreatment.plannedProcedures.length} procedimento(s) planejado(s) · {activeTreatment.status === "ACTIVE" ? "Em andamento" : activeTreatment.status}</p></> : <p className="mt-3 text-sm text-muted-foreground">Nenhum tratamento ativo.</p>}</Card><Card className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-warning">Dados do paciente</p><p className="mt-2 text-sm text-muted-foreground">{patient.email ?? "Sem e-mail"} · {patient.address ?? "Sem endereço"}</p></div><Button onClick={onEdit} size="sm" variant="outline">Editar</Button></div></Card></div>;
}

function HistoryTab({ isPending, items }: { isPending: boolean; items: ClinicalEvolution[] }) {
  if (isPending) return <Card className="p-5"><p className="text-sm text-muted-foreground">Carregando histórico…</p></Card>;
  return <Card className="p-5"><h2 className="text-lg font-bold text-brand-navy">Histórico clínico</h2>{!items.length ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhuma evolução registrada.</p> : <div className="mt-4 grid gap-3">{items.map((item) => <article className="border-l-2 border-primary pl-4" key={item.id}><p className="text-xs font-bold text-primary">Versão {item.version} · {item.status === "CLOSED" ? "Fechada" : "Rascunho"}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.versionCreatedAt).toLocaleString("pt-BR")}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.content}</p></article>)}</div>}</Card>;
}

function TreatmentsTab({ isPending, items }: { isPending: boolean; items: Treatment[] }) {
  if (isPending) return <Card className="p-5"><p className="text-sm text-muted-foreground">Carregando tratamentos…</p></Card>;
  return <Card className="p-5"><h2 className="text-lg font-bold text-brand-navy">Tratamentos</h2>{!items.length ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhum tratamento registrado.</p> : <div className="mt-4 grid gap-3">{items.map((item) => <article className="rounded-xl border border-border p-4" key={item.id}><div className="flex items-start justify-between gap-3"><h3 className="font-bold">{item.name}</h3><span className="text-xs font-semibold text-primary">{treatmentStatusLabel(item.status)}</span></div><p className="mt-2 text-sm text-muted-foreground">{item.notes || "Sem notas adicionais."}</p><p className="mt-2 text-xs text-muted-foreground">{item.plannedProcedures.length} procedimento(s) planejado(s)</p></article>)}</div>}</Card>;
}

type PatientUpdateForm = { fullName: string; dateOfBirth?: string; cpf?: string; phone?: string; email?: string; address?: string; responsiblePatientId?: string };

function EditPatientForm({ patient, busy, onCancel, onSave, error }: { patient: Patient; busy: boolean; onCancel: () => void; onSave: (input: PatientUpdateForm) => void; error: unknown }) {
  const [form, setForm] = useState<PatientUpdateForm>({ fullName: patient.fullName, dateOfBirth: patient.dateOfBirth ?? "", cpf: patient.cpf ?? "", phone: patient.phone ?? "", email: patient.email ?? "", address: patient.address ?? "", responsiblePatientId: patient.responsiblePatientId ?? undefined });
  const change = (field: keyof PatientUpdateForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  return <Card className="p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-brand-navy">Editar paciente</h2><Button onClick={onCancel} size="sm" variant="ghost">Fechar</Button></div><div className="mt-4 grid gap-3"><ProfileField label="Nome completo" value={form.fullName} onChange={(value) => change("fullName", value)} /><div className="grid gap-3 sm:grid-cols-2"><ProfileField label="Nascimento" type="date" value={form.dateOfBirth ?? ""} onChange={(value) => change("dateOfBirth", value)} /><ProfileField label="CPF" value={form.cpf ?? ""} onChange={(value) => change("cpf", value)} /></div><div className="grid gap-3 sm:grid-cols-2"><ProfileField label="Telefone" value={form.phone ?? ""} onChange={(value) => change("phone", value)} /><ProfileField label="E-mail" type="email" value={form.email ?? ""} onChange={(value) => change("email", value)} /></div><ProfileField label="Endereço" value={form.address ?? ""} onChange={(value) => change("address", value)} />{error ? <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error instanceof ApiError ? error.message : "Não foi possível salvar."}</p> : null}<div className="flex gap-2"><Button disabled={busy || !form.fullName.trim()} onClick={() => onSave(form)}>{busy ? "Salvando…" : "Salvar alterações"}</Button><Button onClick={onCancel} variant="outline">Cancelar</Button></div></div></Card>;
}

function ProfileField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><input className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" onChange={(event) => onChange(event.target.value)} type={type} value={value} /></label>; }
function appointmentTypeLabel(type: string) { return ({ CONSULTATION: "Consulta", RETURN: "Retorno", WALK_IN: "Encaixe", URGENT: "Urgência" } as Record<string, string>)[type] ?? type; }
function treatmentStatusLabel(status: string) { return ({ PLANNED: "Planejado", ACTIVE: "Em andamento", PAUSED: "Pausado", COMPLETED: "Concluído", CANCELED: "Cancelado" } as Record<string, string>)[status] ?? status; }
