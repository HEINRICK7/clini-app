import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const plannedProcedureSchema = z.object({ id: z.string().uuid(), tenantId: z.string().uuid(), treatmentId: z.string().uuid(), catalogProcedureId: z.string().uuid().nullable(), expectedUnitId: z.string().uuid().nullable(), name: z.string(), notes: z.string().nullable(), status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELED"]), createdAt: z.string(), updatedAt: z.string() });
const treatmentSchema = z.object({ id: z.string().uuid(), tenantId: z.string().uuid(), patientId: z.string().uuid(), name: z.string(), notes: z.string().nullable(), status: z.enum(["PLANNED", "ACTIVE", "PAUSED", "COMPLETED", "CANCELED"]), createdAt: z.string(), updatedAt: z.string(), plannedProcedures: z.array(plannedProcedureSchema) });
const treatmentPageSchema = z.object({ items: z.array(treatmentSchema), page: z.number(), size: z.number(), totalItems: z.number(), totalPages: z.number() });
const performedSchema = z.object({ id: z.string().uuid(), tenantId: z.string().uuid(), treatmentId: z.string().uuid(), plannedProcedureId: z.string().uuid().nullable(), patientId: z.string().uuid(), unitId: z.string().uuid(), appointmentId: z.string().uuid().nullable(), name: z.string(), version: z.number(), status: z.enum(["DRAFT", "CLOSED"]), content: z.string(), changeReason: z.string().nullable(), authoredByUserId: z.string().uuid(), createdAt: z.string(), versionCreatedAt: z.string() });
const performedPageSchema = z.object({ items: z.array(performedSchema), page: z.number(), size: z.number(), totalItems: z.number(), totalPages: z.number() });

export type Treatment = z.infer<typeof treatmentSchema>;
export type PlannedProcedure = z.infer<typeof plannedProcedureSchema>;
export type PerformedProcedure = z.infer<typeof performedSchema>;

export async function listTreatments(patientId: string): Promise<z.infer<typeof treatmentPageSchema>> { return treatmentPageSchema.parse(await apiRequest<unknown>(`/clinical/treatments?patientId=${encodeURIComponent(patientId)}&size=20`)); }
export async function createTreatment(input: { patientId: string; name: string; notes?: string }): Promise<Treatment> { return treatmentSchema.parse(await apiRequest<unknown>("/clinical/treatments", { method: "POST", body: JSON.stringify(input) })); }
export async function changeTreatmentStatus(treatmentId: string, status: Treatment["status"]): Promise<Treatment> { return treatmentSchema.parse(await apiRequest<unknown>(`/clinical/treatments/${treatmentId}/status`, { method: "POST", body: JSON.stringify({ status }) })); }
export async function addPlannedProcedure(treatmentId: string, input: { name?: string; notes?: string; expectedUnitId?: string; catalogProcedureId?: string }): Promise<PlannedProcedure> { return plannedProcedureSchema.parse(await apiRequest<unknown>(`/clinical/treatments/${treatmentId}/planned-procedures`, { method: "POST", body: JSON.stringify(input) })); }
export async function listPerformedProcedures(treatmentId: string): Promise<z.infer<typeof performedPageSchema>> { return performedPageSchema.parse(await apiRequest<unknown>(`/clinical/treatments/${treatmentId}/performed-procedures?size=20`)); }
export async function createPerformedProcedure(treatmentId: string, input: { plannedProcedureId?: string; unitId: string; name: string; content: string }): Promise<PerformedProcedure> { return performedSchema.parse(await apiRequest<unknown>(`/clinical/treatments/${treatmentId}/performed-procedures`, { method: "POST", body: JSON.stringify(input) })); }
export async function closePerformedProcedure(procedureId: string): Promise<PerformedProcedure> { return performedSchema.parse(await apiRequest<unknown>(`/clinical/treatments/performed-procedures/${procedureId}/close`, { method: "POST" })); }
