import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const toothSummarySchema = z.object({
  toothId: z.string().regex(/^(1[1-8]|2[1-8]|3[1-8]|4[1-8])$/),
  hasRecords: z.boolean(),
  hasOpenPlanning: z.boolean(),
  hasActiveTreatment: z.boolean(),
  lastRecordAt: z.string().nullable(),
  recordCount: z.number().int().nonnegative(),
  latestType: z.enum(["CONDITION", "PROCEDURE", "PLANNING", "NOTE"]).nullable(),
});

const patientOdontogramSchema = z.object({
  patientId: z.string().uuid(),
  unitId: z.string().uuid(),
  teeth: z.array(toothSummarySchema),
});

const toothRecordSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitId: z.string().uuid(),
  patientId: z.string().uuid(),
  toothId: z.string(),
  appointmentId: z.string().uuid().nullable(),
  type: z.enum(["CONDITION", "PROCEDURE", "PLANNING", "NOTE"]),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELED"]).nullable(),
  description: z.string().nullable(),
  procedureId: z.string().uuid().nullable(),
  planItemId: z.string().uuid().nullable(),
  performedAt: z.string(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
});

export type ToothSummary = z.infer<typeof toothSummarySchema>;
export type PatientOdontogram = z.infer<typeof patientOdontogramSchema>;
export type ToothRecord = z.infer<typeof toothRecordSchema>;
export type ToothRecordStatus = NonNullable<ToothRecord["status"]>;

const findingSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["CARIES", "RESTORATION", "FRACTURE", "ROOT_CANAL", "CROWN", "PROSTHESIS", "ABSCESS", "WEAR", "OTHER"]),
  surface: z.enum(["MESIAL", "DISTAL", "OCCLUSAL", "INCISAL", "BUCCAL", "LINGUAL", "PALATAL", "CERVICAL"]).nullable(),
  notes: z.string().nullable(),
});

const toothSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int(),
  dentition: z.enum(["PERMANENT", "DECIDUOUS"]),
  status: z.enum(["PRESENT", "MISSING", "IMPLANT", "UNERUPTED", "SUPERNUMERARY", "UNKNOWN"]),
  notes: z.string().nullable(),
  findings: z.array(findingSchema),
});

const odontogramSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  version: z.number().int().min(1),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
  unitId: z.string().uuid(),
  appointmentId: z.string().uuid().nullable(),
  changeReason: z.string().nullable(),
  authoredByUserId: z.string().uuid(),
  createdAt: z.string(),
  versionCreatedAt: z.string(),
  teeth: z.array(toothSchema),
});

export type Odontogram = z.infer<typeof odontogramSchema>;
export type OdontogramTooth = z.infer<typeof toothSchema>;
export type OdontogramFindingType = z.infer<typeof findingSchema>["type"];
export type OdontogramSurface = NonNullable<z.infer<typeof findingSchema>["surface"]>;
export type OdontogramToothStatus = OdontogramTooth["status"];
export type OdontogramDentition = OdontogramTooth["dentition"];

export type OdontogramToothInput = {
  number: number;
  dentition: OdontogramDentition;
  status: OdontogramToothStatus;
  notes?: string;
  findings: { type: OdontogramFindingType; surface?: OdontogramSurface; notes?: string }[];
};

export async function getOdontogram(patientId: string): Promise<Odontogram> {
  return odontogramSchema.parse(await apiRequest<unknown>(`/clinical/odontograms?patientId=${encodeURIComponent(patientId)}`));
}

export async function createOdontogram(input: { patientId: string; unitId: string; reason?: string; teeth: OdontogramToothInput[] }): Promise<Odontogram> {
  return odontogramSchema.parse(await apiRequest<unknown>("/clinical/odontograms", { method: "POST", body: JSON.stringify(input) }));
}

export async function createOdontogramVersion(odontogramId: string, input: { unitId: string; reason?: string; teeth: OdontogramToothInput[] }): Promise<Odontogram> {
  return odontogramSchema.parse(await apiRequest<unknown>(`/clinical/odontograms/${odontogramId}/versions`, { method: "POST", body: JSON.stringify(input) }));
}

export async function archiveOdontogram(odontogramId: string): Promise<Odontogram> {
  return odontogramSchema.parse(await apiRequest<unknown>(`/clinical/odontograms/${odontogramId}/archive`, { method: "POST" }));
}

export async function getPatientOdontogram(patientId: string): Promise<PatientOdontogram> {
  return patientOdontogramSchema.parse(await apiRequest<unknown>(`/patients/${encodeURIComponent(patientId)}/odontogram`));
}

export async function getToothHistory(patientId: string, toothId: string): Promise<ToothRecord[]> {
  return z.array(toothRecordSchema).parse(await apiRequest<unknown>(`/patients/${encodeURIComponent(patientId)}/teeth/${encodeURIComponent(toothId)}/history`));
}

export async function registerToothCondition(patientId: string, toothId: string, input: {
  unitId: string;
  appointmentId?: string;
  status?: ToothRecordStatus;
  description: string;
  performedAt?: string;
}): Promise<ToothRecord> {
  return toothRecordSchema.parse(await apiRequest<unknown>(`/patients/${encodeURIComponent(patientId)}/teeth/${encodeURIComponent(toothId)}/conditions`, {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function registerToothProcedure(patientId: string, input: {
  unitId: string;
  appointmentId?: string;
  toothIds: string[];
  procedureId: string;
  status?: ToothRecordStatus;
  description?: string;
  performedAt?: string;
}): Promise<ToothRecord[]> {
  return z.array(toothRecordSchema).parse(await apiRequest<unknown>(`/patients/${encodeURIComponent(patientId)}/tooth-procedures`, {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function registerToothNote(patientId: string, toothId: string, input: {
  unitId: string;
  appointmentId?: string;
  description: string;
  performedAt?: string;
}): Promise<ToothRecord> {
  return toothRecordSchema.parse(await apiRequest<unknown>(`/patients/${encodeURIComponent(patientId)}/teeth/${encodeURIComponent(toothId)}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function addToTreatmentPlan(patientId: string, input: {
  unitId: string;
  appointmentId?: string;
  toothIds: string[];
  planItemId: string;
  description?: string;
  performedAt?: string;
}): Promise<ToothRecord[]> {
  return z.array(toothRecordSchema).parse(await apiRequest<unknown>(`/patients/${encodeURIComponent(patientId)}/tooth-planning`, {
    method: "POST",
    body: JSON.stringify(input),
  }));
}
