import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const patientSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  currentUnitId: z.string().uuid(),
  fullName: z.string(),
  dateOfBirth: z.string().nullable(),
  cpf: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  responsiblePatientId: z.string().uuid().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]),
  provisional: z.boolean(),
});

const pageSchema = z.object({
  items: z.array(patientSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type Patient = z.infer<typeof patientSchema>;
export type PatientPage = z.infer<typeof pageSchema>;

export type PatientDraft = {
  currentUnitId: string;
  fullName: string;
  dateOfBirth?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  address?: string;
  responsiblePatientId?: string;
  confirmPossibleDuplicate?: boolean;
};

export async function listPatients(query = "", page = 0, size = 20): Promise<PatientPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (query.trim()) params.set("q", query.trim());
  return pageSchema.parse(await apiRequest<unknown>(`/patients?${params.toString()}`));
}

export async function getPatient(patientId: string): Promise<Patient> {
  return patientSchema.parse(await apiRequest<unknown>(`/patients/${encodeURIComponent(patientId)}`));
}

export async function createPatient(input: PatientDraft): Promise<Patient> {
  return patientSchema.parse(await apiRequest<unknown>("/patients", {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function updatePatient(patientId: string, input: Omit<PatientDraft, "currentUnitId" | "confirmPossibleDuplicate">): Promise<Patient> {
  return patientSchema.parse(await apiRequest<unknown>(`/patients/${encodeURIComponent(patientId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }));
}

export async function transferPatient(patientId: string, targetUnitId: string, reason?: string): Promise<Patient> {
  return patientSchema.parse(await apiRequest<unknown>(`/patients/${patientId}/transfer`, {
    method: "POST",
    body: JSON.stringify({ targetUnitId, reason }),
  }));
}

export async function archivePatient(patientId: string): Promise<Patient> {
  return patientSchema.parse(await apiRequest<unknown>(`/patients/${patientId}/archive`, {
    method: "POST",
  }));
}
