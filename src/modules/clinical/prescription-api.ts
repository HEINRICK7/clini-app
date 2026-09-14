import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const itemSchema = z.object({
  id: z.string().uuid(),
  medicationName: z.string(),
  activeIngredient: z.string().nullable(),
  concentration: z.string().nullable(),
  pharmaceuticalForm: z.string().nullable(),
  route: z.string().nullable(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string().nullable(),
  quantity: z.string().nullable(),
  instructions: z.string().nullable(),
});
const prescriptionSchema = z.object({
  id: z.string().uuid(), tenantId: z.string().uuid(), patientId: z.string().uuid(), version: z.number().int(),
  status: z.enum(["DRAFT", "CLOSED", "ARCHIVED"]), unitId: z.string().uuid(), appointmentId: z.string().uuid().nullable(),
  changeReason: z.string().nullable(), authoredByUserId: z.string().uuid(), createdAt: z.string(), versionCreatedAt: z.string(), items: z.array(itemSchema),
});
const pageSchema = z.object({ items: z.array(prescriptionSchema), page: z.number(), size: z.number(), totalItems: z.number(), totalPages: z.number() });

export type Prescription = z.infer<typeof prescriptionSchema>;
export type PrescriptionItemInput = { medicationName: string; activeIngredient?: string; concentration?: string; pharmaceuticalForm?: string; route?: string; dosage: string; frequency: string; duration?: string; quantity?: string; instructions?: string };

export async function listPrescriptions(patientId: string): Promise<z.infer<typeof pageSchema>> { return pageSchema.parse(await apiRequest<unknown>(`/clinical/prescriptions?patientId=${encodeURIComponent(patientId)}&size=20`)); }
export async function createPrescription(input: { patientId: string; unitId: string; items: PrescriptionItemInput[]; reason?: string }): Promise<Prescription> { return prescriptionSchema.parse(await apiRequest<unknown>("/clinical/prescriptions", { method: "POST", body: JSON.stringify(input) })); }
export async function updatePrescription(id: string, input: { unitId: string; items: PrescriptionItemInput[]; reason?: string }): Promise<Prescription> { return prescriptionSchema.parse(await apiRequest<unknown>(`/clinical/prescriptions/${id}`, { method: "PATCH", body: JSON.stringify(input) })); }
export async function closePrescription(id: string): Promise<Prescription> { return prescriptionSchema.parse(await apiRequest<unknown>(`/clinical/prescriptions/${id}/close`, { method: "POST" })); }
export async function rectifyPrescription(id: string, items: PrescriptionItemInput[], reason: string): Promise<Prescription> { return prescriptionSchema.parse(await apiRequest<unknown>(`/clinical/prescriptions/${id}/rectify`, { method: "POST", body: JSON.stringify({ items, reason }) })); }
export async function archivePrescription(id: string): Promise<Prescription> { return prescriptionSchema.parse(await apiRequest<unknown>(`/clinical/prescriptions/${id}/archive`, { method: "POST" })); }
