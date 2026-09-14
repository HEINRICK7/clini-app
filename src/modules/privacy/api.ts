import { z } from "zod";

import { apiDownload, apiRequest } from "@/lib/api/client";

const requestSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  type: z.enum(["ACCESS", "RECTIFICATION", "ANONYMIZATION_REVIEW", "DELETION_REVIEW"]),
  status: z.enum(["OPEN", "IN_REVIEW", "COMPLETED", "REJECTED", "CANCELED"]),
  details: z.string().nullable(),
  resolution: z.string().nullable(),
  createdByUserId: z.string().uuid(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const pageSchema = z.object({
  items: z.array(requestSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type PrivacyRequest = z.infer<typeof requestSchema>;
export type PrivacyRequestType = PrivacyRequest["type"];
export type PrivacyRequestStatus = PrivacyRequest["status"];

export async function downloadPatientDataExport(patientId: string): Promise<Blob> {
  return apiDownload(`/privacy/patients/${patientId}/export`, "application/json");
}

export async function listPrivacyRequests(input: { patientId?: string; status?: PrivacyRequestStatus } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) if (value) params.set(key, value);
  params.set("size", "30");
  return pageSchema.parse(await apiRequest<unknown>(`/privacy/requests?${params.toString()}`));
}

export async function createPrivacyRequest(input: { patientId: string; type: PrivacyRequestType; details?: string }) {
  return requestSchema.parse(await apiRequest<unknown>("/privacy/requests", { method: "POST", body: JSON.stringify(input) }));
}

export async function changePrivacyRequestStatus(id: string, status: PrivacyRequestStatus, resolution?: string) {
  return requestSchema.parse(await apiRequest<unknown>(`/privacy/requests/${id}/status`, {
    method: "POST", body: JSON.stringify({ status, resolution: resolution || undefined }),
  }));
}
