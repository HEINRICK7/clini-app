import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const documentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  type: z.enum(["CLINICAL_REPORT", "EXAM_RESULT", "REFERRAL", "CONSENT", "OTHER"]),
  title: z.string(),
  version: z.number().int().min(1),
  status: z.enum(["DRAFT", "CLOSED", "ARCHIVED"]),
  unitId: z.string().uuid(),
  appointmentId: z.string().uuid().nullable(),
  content: z.string(),
  contentSha256: z.string().length(64),
  changeReason: z.string().nullable(),
  authoredByUserId: z.string().uuid(),
  createdAt: z.string(),
  versionCreatedAt: z.string(),
});

const pageSchema = z.object({
  items: z.array(documentSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type ClinicalDocument = z.infer<typeof documentSchema>;
export type ClinicalDocumentType = ClinicalDocument["type"];

export async function listClinicalDocuments(patientId: string): Promise<z.infer<typeof pageSchema>> {
  return pageSchema.parse(await apiRequest<unknown>(`/clinical/documents?patientId=${encodeURIComponent(patientId)}&size=20`));
}

export async function createClinicalDocument(input: { patientId: string; unitId: string; type: ClinicalDocumentType; title: string; content: string; reason?: string }): Promise<ClinicalDocument> {
  return documentSchema.parse(await apiRequest<unknown>("/clinical/documents", { method: "POST", body: JSON.stringify(input) }));
}

export async function updateClinicalDocument(documentId: string, input: { unitId: string; title: string; content: string; reason?: string }): Promise<ClinicalDocument> {
  return documentSchema.parse(await apiRequest<unknown>(`/clinical/documents/${documentId}`, { method: "PATCH", body: JSON.stringify(input) }));
}

export async function closeClinicalDocument(documentId: string): Promise<ClinicalDocument> {
  return documentSchema.parse(await apiRequest<unknown>(`/clinical/documents/${documentId}/close`, { method: "POST" }));
}

export async function rectifyClinicalDocument(documentId: string, content: string, reason: string): Promise<ClinicalDocument> {
  return documentSchema.parse(await apiRequest<unknown>(`/clinical/documents/${documentId}/rectify`, { method: "POST", body: JSON.stringify({ content, reason }) }));
}

export async function archiveClinicalDocument(documentId: string): Promise<ClinicalDocument> {
  return documentSchema.parse(await apiRequest<unknown>(`/clinical/documents/${documentId}/archive`, { method: "POST" }));
}
