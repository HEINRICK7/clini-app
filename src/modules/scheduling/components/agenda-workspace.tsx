"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

import { useCliniServices } from "@/app/service-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiErrorMessage, isUnauthorized } from "@/lib/error-policy";
import { useCurrentUnit } from "@/modules/auth/components/auth-gate";
import type { Appointment } from "@/app/services";
import { addDays, displayTime, formatRangeLabel, instant, localDate, rangeEnd, type AgendaView } from "@/modules/scheduling/application/calendar-rules";

const weekdayLabels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const defaultAvailability = weekdayLabels.map((_, index) => ({ dayOfWeek: index + 1, startsAt: "08:00", endsAt: "18:00", enabled: false }));

export function AgendaWorkspace() {
  const { patient, practice, scheduling } = useCliniServices();
  const queryClient = useQueryClient();
  const { selectedUnitId } = useCurrentUnit();
  const [date, setDate] = useState(localDate);
  const [unitId, setUnitId] = useState(selectedUnitId ?? "");
  const [view, setView] = useState<AgendaView>("day");
  const [showComposer, setShowComposer] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [type, setType] = useState<Appointment["type"]>("CONSULTATION");
  const [fitIn, setFitIn] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: practice.listUnits, retry: false });
  const patientsQuery = useQuery({ queryKey: ["patients", "agenda"], queryFn: () => patient.listPatients(), retry: false });
  const availabilityQuery = useQuery({ queryKey: ["availability", unitId], queryFn: () => scheduling.listAvailability(unitId), enabled: Boolean(unitId), retry: false });
  const serverAvailability = useMemo(() => defaultAvailability.map((day) => {
      const saved = availabilityQuery.data?.find((hour) => hour.dayOfWeek === day.dayOfWeek);
      return saved ? { dayOfWeek: day.dayOfWeek, startsAt: saved.startsAt.slice(0, 5), endsAt: saved.endsAt.slice(0, 5), enabled: true } : day;
    }), [availabilityQuery.data]);
  const [availabilityOverrides, setAvailabilityOverrides] = useState<typeof defaultAvailability | null>(null);
  const availability = availabilityOverrides ?? serverAvailability;
  const activeUnits = useMemo(() => (unitsQuery.data ?? []).filter((unit) => unit.status === "ACTIVE"), [unitsQuery.data]);
  const periodEnd = rangeEnd(date, view);
  const agendaQuery = useQuery({
    queryKey: ["agenda", date, periodEnd, unitId],
    queryFn: () => scheduling.listAgenda(instant(date, "00:00"), instant(periodEnd, "00:00"), unitId || undefined),
    retry: false,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["agenda"] });
  const appointmentMutation = useMutation({
    mutationFn: () => scheduling.createAppointment({ unitId, patientId, startsAt: instant(date, start), endsAt: instant(date, end), type, fitIn, notes: type === "URGENT" ? "Atendimento de urgência" : undefined }),
    onSuccess: async () => { setMessage("Atendimento criado."); await refresh(); },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível criar o atendimento.")),
  });
  const blockMutation = useMutation({
    mutationFn: () => scheduling.createScheduleBlock({ unitId: unitId || undefined, startsAt: instant(date, start), endsAt: instant(date, end), reason }),
    onSuccess: async () => { setMessage("Bloqueio criado."); setReason(""); await refresh(); },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível criar o bloqueio.")),
  });
  const availabilityMutation = useMutation({
    mutationFn: () => scheduling.replaceAvailability(unitId, availability.filter((day) => day.enabled).map(({ dayOfWeek, startsAt, endsAt }) => ({ dayOfWeek, startsAt: `${startsAt}:00`, endsAt: `${endsAt}:00` }))),
    onSuccess: async () => { setAvailabilityOverrides(null); setMessage("Funcionamento semanal salvo."); await queryClient.invalidateQueries({ queryKey: ["availability", unitId] }); },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível salvar o funcionamento.")),
  });
  const cancelMutation = useMutation({
    mutationFn: (appointmentId: string) => scheduling.cancelAppointment(appointmentId),
    onSuccess: async () => { setMessage("Atendimento cancelado com histórico preservado."); await refresh(); },
    onError: (error) => setMessage(apiErrorMessage(error, "Não foi possível cancelar.")),
  });
  const busy = appointmentMutation.isPending || blockMutation.isPending || cancelMutation.isPending || availabilityMutation.isPending;

  if (agendaQuery.isError && isUnauthorized(agendaQuery.error)) {
    return <Card className="p-5"><h2 className="text-lg font-bold">Agenda</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Entre para acessar a agenda.</p></Card>;
  }
  if (agendaQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar a agenda.</p></Card>;

  const agenda = agendaQuery.data;
  const patients = patientsQuery.data?.items.filter((patient) => patient.status === "ACTIVE") ?? [];
  return (
    <section className="grid gap-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold text-primary">Sua rotina</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-navy">Agenda</h1><p className="mt-1 text-sm text-muted-foreground">Organize os atendimentos do seu dia.</p></div>
        <Button aria-label="Novo agendamento" className="h-12 w-12 shrink-0 rounded-full px-0 shadow-md" onClick={() => setShowComposer((current) => !current)}><Plus aria-hidden="true" className="h-5 w-5" /></Button>
      </div>
      <div className="grid grid-cols-3 rounded-xl border border-border bg-surface-muted p-1" role="tablist" aria-label="Período da agenda">
        {([["day", "Hoje"], ["week", "Semana"], ["month", "Mês"]] as const).map(([value, label]) => <button aria-selected={view === value} className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition-colors ${view === value ? "bg-surface text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`} key={value} onClick={() => setView(value)} role="tab" type="button">{label}</button>)}
      </div>
      <div className="flex items-center justify-between gap-3"><Button aria-label="Período anterior" className="h-10 w-10 px-0" onClick={() => setDate(addDays(date, view === "day" ? -1 : view === "week" ? -7 : -30))} size="sm" variant="ghost"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></Button><div className="text-center"><p className="text-sm font-bold text-brand-navy">{formatRangeLabel(date, view)}</p><p className="text-xs text-muted-foreground">{currentUnitLabel(activeUnits, unitId)}</p></div><Button aria-label="Próximo período" className="h-10 w-10 px-0" onClick={() => setDate(addDays(date, view === "day" ? 1 : view === "week" ? 7 : 30))} size="sm" variant="ghost"><ChevronRight aria-hidden="true" className="h-5 w-5" /></Button></div>
      {showComposer ? <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Novo atendimento</p><h2 className="mt-1 text-xl font-bold tracking-tight">Adicionar à agenda</h2></div><Button aria-label="Fechar novo agendamento" className="h-10 w-10 px-0" onClick={() => setShowComposer(false)} size="sm" variant="ghost"><X aria-hidden="true" className="h-5 w-5" /></Button></div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Todo atendimento fica ligado a um paciente e a um local. Bloqueios operacionais ficam separados.</p>
        <div className="mt-5 grid gap-3">
          <AgendaSelect label="Local de atendimento" value={unitId} onChange={(value) => { setUnitId(value); setAvailabilityOverrides(null); }} options={activeUnits.map((unit) => ({ value: unit.id, label: unit.name }))} />
          <AgendaSelect label="Paciente" value={patientId} onChange={setPatientId} options={patients.filter((patient) => !unitId || patient.currentUnitId === unitId).map((patient) => ({ value: patient.id, label: patient.fullName }))} />
          <div className="grid gap-3 sm:grid-cols-3"><AgendaField label="Data" type="date" value={date} onChange={setDate} /><AgendaField label="Início" type="time" value={start} onChange={setStart} /><AgendaField label="Fim" type="time" value={end} onChange={setEnd} /></div>
          <AgendaSelect label="Tipo" value={type} onChange={(value) => setType(value as Appointment["type"])} options={[{ value: "CONSULTATION", label: "Consulta" }, { value: "RETURN", label: "Retorno" }, { value: "WALK_IN", label: "Encaixe" }, { value: "URGENT", label: "Urgência" }]} />
          <label className="flex min-h-11 items-center gap-2 text-sm"><input checked={fitIn} onChange={(event) => setFitIn(event.target.checked)} type="checkbox" /> Autorizar como encaixe se houver conflito</label>
          {message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}
          <Button disabled={busy || !unitId || !patientId} onClick={() => appointmentMutation.mutate()}>{appointmentMutation.isPending ? "Salvando…" : "Criar atendimento"}</Button>
          <div className="border-t border-border pt-4"><p className="mb-2 text-sm font-semibold">Bloqueio sem paciente</p><AgendaField label="Motivo" value={reason} onChange={setReason} /><Button className="mt-3 w-full" disabled={busy || !reason.trim()} onClick={() => blockMutation.mutate()} variant="outline">Criar bloqueio</Button></div>
          <div className="border-t border-border pt-4"><p className="mb-2 text-sm font-semibold">Funcionamento semanal</p><p className="mb-3 text-xs leading-5 text-muted-foreground">Opcional. Quando preenchido, impede novos atendimentos fora desses horários.</p><div className="grid gap-2">{availability.map((day, index) => <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2" key={day.dayOfWeek}><label className="flex min-h-11 items-center gap-2 text-xs font-semibold"><input checked={day.enabled} onChange={(event) => setAvailabilityOverrides((current) => (current ?? serverAvailability).map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, enabled: event.target.checked } : item))} type="checkbox" />{weekdayLabels[index]}</label><input aria-label={`${weekdayLabels[index]} início`} className="min-h-11 rounded-xl border border-border bg-surface px-2 text-sm" disabled={!day.enabled} onChange={(event) => setAvailabilityOverrides((current) => (current ?? serverAvailability).map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, startsAt: event.target.value } : item))} type="time" value={day.startsAt} /><input aria-label={`${weekdayLabels[index]} fim`} className="min-h-11 rounded-xl border border-border bg-surface px-2 text-sm" disabled={!day.enabled} onChange={(event) => setAvailabilityOverrides((current) => (current ?? serverAvailability).map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, endsAt: event.target.value } : item))} type="time" value={day.endsAt} /></div>)}</div><Button className="mt-3 w-full" disabled={busy || !unitId} onClick={() => availabilityMutation.mutate()} variant="outline">Salvar horários</Button></div>
        </div>
      </Card> : null}

      <Card className="p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary"><CalendarPlus aria-hidden="true" className="mr-1 inline h-4 w-4" />{view === "day" ? "Hoje" : view === "week" ? "Esta semana" : "Este mês"}</p><h2 className="mt-1 text-xl font-bold tracking-tight">Compromissos</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{(agenda?.appointments.length ?? 0) + (agenda?.blocks.length ?? 0)}</span></div>
        <div className="mt-4 grid gap-3">
          {agendaQuery.isPending ? <p className="text-sm text-muted-foreground">Carregando agenda…</p> : null}
          {!agendaQuery.isPending && !agenda?.appointments.length && !agenda?.blocks.length ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm leading-6 text-muted-foreground">Nenhum compromisso ou bloqueio neste dia.</p> : null}
          {agenda?.appointments.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} busy={busy} onCancel={() => cancelMutation.mutate(appointment.id)} />)}
          {agenda?.blocks.map((block) => <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4" key={block.id}><p className="text-xs font-bold uppercase tracking-wide text-amber-800">Bloqueio · {displayTime(block.startsAt)}–{displayTime(block.endsAt)}</p><h3 className="mt-1 font-bold text-amber-950">{block.reason}</h3><p className="mt-1 text-sm text-amber-900">{block.unitId ? "Local específico" : "Todos os locais"}</p></article>)}
        </div>
      </Card>
    </section>
  );
}

function AppointmentCard({ appointment, busy, onCancel }: { appointment: Appointment; busy: boolean; onCancel: () => void }) {
  const typeLabel = { CONSULTATION: "Consulta", RETURN: "Retorno", WALK_IN: "Encaixe", URGENT: "Urgência" }[appointment.type];
  return <article className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">{displayTime(appointment.startsAt)}–{displayTime(appointment.endsAt)} · {typeLabel}</p><h3 className="mt-1 font-bold">Paciente {appointment.patientId.slice(0, 8)}</h3><p className="mt-1 text-sm text-muted-foreground">{appointment.fitIn ? "Encaixe autorizado" : "Atendimento agendado"}</p></div><span className="rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-success">{appointment.status === "SCHEDULED" ? "Agendado" : appointment.status}</span></div><Button className="mt-3" disabled={busy} onClick={onCancel} size="sm" variant="ghost">Cancelar</Button></article>;
}

function AgendaSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><select className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Selecione</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function AgendaField({ label, type = "text", value, onChange }: { label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><input className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal outline-none focus:border-primary focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} type={type} value={value} /></label>;
}

function currentUnitLabel(units: { id: string; name: string }[], unitId: string) {
  return units.find((unit) => unit.id === unitId)?.name ?? "Todos os locais";
}
