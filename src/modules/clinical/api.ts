import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const evolutionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  unitId: z.string().uuid(),
  appointmentId: z.string().uuid().nullable(),
  version: z.number().int().min(1),
  status: z.enum(["DRAFT", "CLOSED"]),
  content: z.string(),
  changeReason: z.string().nullable(),
  authoredByUserId: z.string().uuid(),
  createdAt: z.string(),
  versionCreatedAt: z.string(),
});

const pageSchema = z.object({
  items: z.array(evolutionSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type ClinicalEvolution = z.infer<typeof evolutionSchema>;
export type ClinicalEvolutionPage = z.infer<typeof pageSchema>;

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

const completionSchema = z.object({
  evolution: evolutionSchema,
  completedAppointment: appointmentSchema.nullable(),
  returnAppointment: appointmentSchema.nullable(),
});

export type ClinicalAppointmentCompletion = z.infer<typeof completionSchema>;

export async function listClinicalEvolutions(patientId: string, page = 0, size = 20): Promise<ClinicalEvolutionPage> {
  return pageSchema.parse(await apiRequest<unknown>(`/clinical/evolutions?patientId=${encodeURIComponent(patientId)}&page=${page}&size=${size}`));
}

export async function createClinicalEvolution(input: { patientId: string; unitId: string; content: string; appointmentId?: string }): Promise<ClinicalEvolution> {
  return evolutionSchema.parse(await apiRequest<unknown>("/clinical/evolutions", { method: "POST", body: JSON.stringify(input) }));
}

export async function completeAppointment(input: {
  patientId: string;
  unitId: string;
  appointmentId?: string;
  content: string;
  nextStep: "completed" | "return" | "continue";
  returnAppointment?: { startsAt: string; endsAt: string };
}): Promise<ClinicalAppointmentCompletion> {
  return completionSchema.parse(await apiRequest<unknown>("/clinical/appointments/complete", {
    method: "POST",
    body: JSON.stringify({ ...input, nextStep: input.nextStep.toUpperCase() }),
  }));
}

export async function closeClinicalEvolution(evolutionId: string): Promise<ClinicalEvolution> {
  return evolutionSchema.parse(await apiRequest<unknown>(`/clinical/evolutions/${evolutionId}/close`, { method: "POST" }));
}

export async function rectifyClinicalEvolution(evolutionId: string, content: string, reason: string): Promise<ClinicalEvolution> {
  return evolutionSchema.parse(await apiRequest<unknown>(`/clinical/evolutions/${evolutionId}/rectify`, {
    method: "POST",
    body: JSON.stringify({ content, reason }),
  }));
}
