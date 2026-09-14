import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

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
