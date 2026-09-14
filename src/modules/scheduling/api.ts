import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const appointmentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitId: z.string().uuid(),
  patientId: z.string().uuid(),
  previousAppointmentId: z.string().uuid().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  type: z.enum(["CONSULTATION", "RETURN", "WALK_IN", "URGENT"]),
  status: z.enum(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELED"]),
  fitIn: z.boolean(),
  notes: z.string().nullable(),
});

const blockSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitId: z.string().uuid().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  reason: z.string(),
});

const agendaSchema = z.object({ appointments: z.array(appointmentSchema), blocks: z.array(blockSchema) });
const weeklyHourSchema = z.object({ id: z.string().uuid(), dayOfWeek: z.number().int().min(1).max(7), day: z.string(), startsAt: z.string(), endsAt: z.string() });

export type Appointment = z.infer<typeof appointmentSchema>;
export type ScheduleBlock = z.infer<typeof blockSchema>;
export type Agenda = z.infer<typeof agendaSchema>;
export type WeeklyHour = z.infer<typeof weeklyHourSchema>;

export async function listAgenda(from: string, to: string, unitId?: string): Promise<Agenda> {
  const params = new URLSearchParams({ from, to });
  if (unitId) params.set("unitId", unitId);
  return agendaSchema.parse(await apiRequest<unknown>(`/agenda?${params.toString()}`));
}

export async function createAppointment(input: {
  unitId: string;
  patientId: string;
  startsAt: string;
  endsAt: string;
  type: Appointment["type"];
  fitIn: boolean;
  notes?: string;
}): Promise<Appointment> {
  return appointmentSchema.parse(await apiRequest<unknown>("/agenda/appointments", { method: "POST", body: JSON.stringify(input) }));
}

export async function createScheduleBlock(input: { unitId?: string; startsAt: string; endsAt: string; reason: string }): Promise<ScheduleBlock> {
  return blockSchema.parse(await apiRequest<unknown>("/agenda/blocks", { method: "POST", body: JSON.stringify(input) }));
}

export async function cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment> {
  return appointmentSchema.parse(await apiRequest<unknown>(`/agenda/appointments/${appointmentId}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }));
}

export async function listAvailability(unitId: string): Promise<WeeklyHour[]> {
  return z.array(weeklyHourSchema).parse(await apiRequest<unknown>(`/units/${unitId}/availability`));
}

export async function replaceAvailability(unitId: string, hours: { dayOfWeek: number; startsAt: string; endsAt: string }[]): Promise<WeeklyHour[]> {
  return z.array(weeklyHourSchema).parse(await apiRequest<unknown>(`/units/${unitId}/availability`, { method: "PUT", body: JSON.stringify(hours) }));
}
