import { z } from "zod";

import { apiDownload, apiRequest } from "@/lib/api/client";

const attachmentSchema = z.object({
  id: z.string().uuid(), tenantId: z.string().uuid(), patientId: z.string().uuid(), unitId: z.string().uuid(),
  clinicalDocumentId: z.string().uuid().nullable(), originalFilename: z.string(), contentType: z.string(), sizeBytes: z.number().int(),
  sha256: z.string().length(64), status: z.enum(["ACTIVE", "ARCHIVED"]), createdByUserId: z.string().uuid(),
  createdAt: z.string(), archivedAt: z.string().nullable(),
});
const pageSchema = z.object({ items: z.array(attachmentSchema), page: z.number(), size: z.number(), totalItems: z.number(), totalPages: z.number() });

export type ClinicalAttachment = z.infer<typeof attachmentSchema>;

export async function listClinicalAttachments(patientId: string) {
  return pageSchema.parse(await apiRequest<unknown>(`/clinical/attachments?patientId=${encodeURIComponent(patientId)}&size=20`));
}

export async function uploadClinicalAttachment(input: { patientId: string; unitId: string; clinicalDocumentId?: string; file: File }) {
  const body = new FormData();
  body.append("patientId", input.patientId);
  body.append("unitId", input.unitId);
  if (input.clinicalDocumentId) body.append("clinicalDocumentId", input.clinicalDocumentId);
  body.append("file", input.file, input.file.name);
  return attachmentSchema.parse(await apiRequest<unknown>("/clinical/attachments", { method: "POST", body }));
}

export async function archiveClinicalAttachment(id: string) {
  return attachmentSchema.parse(await apiRequest<unknown>(`/clinical/attachments/${id}/archive`, { method: "POST" }));
}

export async function downloadClinicalAttachment(id: string) {
  return apiDownload(`/clinical/attachments/${id}/content`);
}
