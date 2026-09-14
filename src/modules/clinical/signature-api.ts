import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const signatureSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  clinicalDocumentId: z.string().uuid(),
  documentVersion: z.number().int().min(1),
  documentContentSha256: z.string().length(64),
  signatureType: z.literal("QUALIFIED_ICP_BRASIL"),
  providerKey: z.string(),
  status: z.enum(["READY", "SUBMITTED", "SIGNED", "DECLINED", "EXPIRED", "CANCELED"]),
  signerUserId: z.string().uuid(),
  externalRequestId: z.string().nullable(),
  signedAt: z.string().nullable(),
  evidenceHash: z.string().nullable(),
  certificateSubject: z.string().nullable(),
  certificateSerialNumber: z.string().nullable(),
  validationPolicy: z.string().nullable(),
  providerPayloadSha256: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type QualifiedSignatureRequest = z.infer<typeof signatureSchema>;

const providerStatusSchema = z.object({
  signatureType: z.literal("QUALIFIED_ICP_BRASIL"),
  providerKey: z.string(),
  configured: z.boolean(),
});

export type QualifiedSignatureProviderStatus = z.infer<typeof providerStatusSchema>;

export async function getQualifiedSignatureProviderStatus(): Promise<QualifiedSignatureProviderStatus> {
  return providerStatusSchema.parse(await apiRequest<unknown>("/clinical/signatures/provider-status"));
}

export async function listQualifiedSignatures(patientId: string): Promise<QualifiedSignatureRequest[]> {
  return z.array(signatureSchema).parse(await apiRequest<unknown>(`/clinical/signatures?patientId=${encodeURIComponent(patientId)}`));
}

export async function requestQualifiedSignature(clinicalDocumentId: string, idempotencyKey: string): Promise<QualifiedSignatureRequest> {
  return signatureSchema.parse(await apiRequest<unknown>("/clinical/signatures", {
    method: "POST",
    headers: { "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ clinicalDocumentId }),
  }));
}

export async function cancelQualifiedSignature(requestId: string, reason: string): Promise<QualifiedSignatureRequest> {
  return signatureSchema.parse(await apiRequest<unknown>(`/clinical/signatures/${requestId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }));
}

export async function submitQualifiedSignature(requestId: string): Promise<QualifiedSignatureRequest> {
  return signatureSchema.parse(await apiRequest<unknown>(`/clinical/signatures/${requestId}/submit`, { method: "POST" }));
}
