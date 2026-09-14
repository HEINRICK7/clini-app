"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CalendarDays, Clock3, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { listCatalogProcedures } from "@/modules/catalog/api";
import { listPatients } from "@/modules/patient/api";
import { useCurrentUnit } from "@/modules/auth/components/auth-gate";
import { createAppointment, type Appointment } from "@/modules/scheduling/api";
import { listUnits } from "@/modules/practice/api";

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function instant(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function NewAppointmentScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { selectedUnitId } = useCurrentUnit();
  const [patientId, setPatientId] = useState(searchParams.get("patientId") ?? "");
  const [unitId, setUnitId] = useState(selectedUnitId ?? "");
  const [date, setDate] = useState(searchParams.get("date") ?? localDate());
  const [start, setStart] = useState("10:30");
  const [end, setEnd] = useState("11:30");
  const [procedureId, setProcedureId] = useState("");
  const [type, setType] = useState<Appointment["type"]>("CONSULTATION");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const unitsQuery = useQuery({ queryKey: ["units", "new-appointment"], queryFn: listUnits, retry: false });
  const patientsQuery = useQuery({ queryKey: ["patients", "new-appointment"], queryFn: () => listPatients(), retry: false });
  const patients = patientsQuery.data?.items.filter((patient) => patient.status === "ACTIVE") ?? [];
  const patient = patients.find((item) => item.id === patientId);
  const effectiveUnitId = unitId || patient?.currentUnitId || unitsQuery.data?.find((unit) => unit.primary && unit.status === "ACTIVE")?.id || "";
  const proceduresQuery = useQuery({ queryKey: ["catalog-procedures", "new-appointment", effectiveUnitId], queryFn: () => listCatalogProcedures({ unitId: effectiveUnitId }), enabled: Boolean(effectiveUnitId), retry: false });
  const mutation = useMutation({
    mutationFn: () => createAppointment({ unitId: effectiveUnitId, patientId, startsAt: instant(date, start), endsAt: instant(date, end), type, fitIn: false, notes: composeNotes(notes, proceduresQuery.data?.items.find((item) => item.id === procedureId)?.name) }),
    onSuccess: async () => {
      setMessage("Agendamento salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["agenda"] });
      window.setTimeout(() => router.push("/agenda"), 450);
    },
    onError: (error) => setMessage(error instanceof ApiError ? error.message : "Não foi possível salvar o agendamento."),
  });

  return <section className="mx-auto w-full max-w-2xl">
    <div className="mb-5 flex items-center gap-2"><Button aria-label="Voltar para agenda" className="h-10 w-10 px-0" onClick={() => router.back()} size="sm" variant="ghost"><ArrowLeft aria-hidden="true" className="h-5 w-5" /></Button><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Agenda</p><h1 className="text-xl font-bold tracking-tight text-brand-navy">Novo agendamento</h1></div></div>
    <Card className="p-5 sm:p-6"><div className="grid gap-4"><AppointmentSelect label="Paciente" value={patientId} onChange={setPatientId} options={patients.map((item) => ({ value: item.id, label: item.fullName }))} /><div className="grid gap-3 sm:grid-cols-2"><AppointmentField icon={CalendarDays} label="Data" type="date" value={date} onChange={setDate} /><AppointmentField icon={Clock3} label="Horário" type="time" value={start} onChange={(value) => { setStart(value); setEnd(addHour(value)); }} /></div><AppointmentSelect label="Procedimento" value={procedureId} onChange={setProcedureId} options={(proceduresQuery.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }))} /><AppointmentSelect label="Tipo de atendimento" value={type} onChange={(value) => setType(value as Appointment["type"])} options={[{ value: "CONSULTATION", label: "Consulta" }, { value: "RETURN", label: "Retorno" }, { value: "WALK_IN", label: "Encaixe" }, { value: "URGENT", label: "Urgência" }]} /><AppointmentSelect icon={MapPin} label="Local de atendimento" value={effectiveUnitId} onChange={setUnitId} options={(unitsQuery.data ?? []).filter((unit) => unit.status === "ACTIVE").map((unit) => ({ value: unit.id, label: unit.name }))} /><label className="grid gap-1.5 text-sm font-semibold"><span>Observações <span className="font-normal text-muted-foreground">(opcional)</span></span><textarea className="min-h-24 rounded-xl border border-border bg-surface px-3 py-3 text-sm font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" onChange={(event) => setNotes(event.target.value)} placeholder="Ex.: retorno, observações…" value={notes} /></label>{message ? <p aria-live="polite" className={`rounded-xl px-3 py-2 text-sm ${mutation.isError ? "bg-danger/10 text-danger" : "bg-green-50 text-success"}`}>{message}</p> : null}<Button className="w-full" disabled={mutation.isPending || !patientId || !effectiveUnitId || !date || !start || !end} onClick={() => mutation.mutate()}>{mutation.isPending ? "Salvando…" : "Salvar agendamento"}</Button></div></Card>
  </section>;
}

function AppointmentField({ icon: Icon, label, type, value, onChange }: { icon: typeof CalendarDays; label: string; type: string; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><span className="relative"><Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><input className="min-h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-3 text-sm font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" onChange={(event) => onChange(event.target.value)} type={type} value={value} /></span></label>; }
function AppointmentSelect({ icon: Icon, label, value, onChange, options }: { icon?: typeof MapPin; label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><span className="relative">{Icon ? <Icon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /> : null}<select className={`min-h-12 w-full appearance-none rounded-xl border border-border bg-surface px-3 text-sm font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 ${Icon ? "pl-10" : ""}`} onChange={(event) => onChange(event.target.value)} value={value}><option value="">Selecione</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></span></label>; }
function composeNotes(notes: string, procedure?: string) { return [procedure ? `Procedimento: ${procedure}` : "", notes.trim()].filter(Boolean).join("\n"); }
function addHour(value: string) { const [hours, minutes] = value.split(":").map(Number); const next = new Date(2000, 0, 1, hours, minutes); next.setHours(next.getHours() + 1); return `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`; }
