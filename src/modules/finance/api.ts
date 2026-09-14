import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const entrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitId: z.string().uuid().nullable(),
  patientId: z.string().uuid().nullable(),
  type: z.enum(["INCOME", "EXPENSE"]),
  status: z.enum(["OPEN", "SETTLED", "CANCELED"]),
  description: z.string(),
  notes: z.string().nullable(),
  amountCents: z.number().int().positive(),
  occurredOn: z.string(),
  dueOn: z.string().nullable(),
  paymentMethod: z.enum(["CASH", "PIX", "CARD", "BANK_TRANSFER", "OTHER"]).nullable(),
  paymentReference: z.string().nullable(),
  settledOn: z.string().nullable(),
  canceledAt: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  createdByUserId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const pageSchema = z.object({
  items: z.array(entrySchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

const summarySchema = z.object({
  incomeCents: z.number().int(),
  expenseCents: z.number().int(),
  balanceCents: z.number().int(),
  openIncomeCents: z.number().int(),
  openExpenseCents: z.number().int(),
  totalItems: z.number().int(),
});

export type FinancialEntry = z.infer<typeof entrySchema>;
export type FinancialSummary = z.infer<typeof summarySchema>;
export type FinancialType = FinancialEntry["type"];
export type FinancialStatus = FinancialEntry["status"];
export type PaymentMethod = NonNullable<FinancialEntry["paymentMethod"]>;

export type FinancialFilters = {
  type?: FinancialType;
  status?: FinancialStatus;
  unitId?: string;
  patientId?: string;
  from?: string;
  to?: string;
};

function queryString(input: FinancialFilters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) if (value) params.set(key, value);
  return params.toString();
}

export async function listFinancialEntries(input: FinancialFilters & { page?: number; size?: number } = {}) {
  const { page = 0, size = 30, ...filters } = input;
  const params = queryString(filters);
  const separator = params ? "&" : "";
  return pageSchema.parse(await apiRequest<unknown>(`/finance/entries?${params}${separator}page=${page}&size=${size}`));
}

export async function getFinancialSummary(input: FinancialFilters = {}) {
  const params = queryString(input);
  return summarySchema.parse(await apiRequest<unknown>(`/finance/summary${params ? `?${params}` : ""}`));
}

export type FinancialDraft = {
  type: FinancialType;
  description: string;
  notes?: string;
  amountCents: number;
  occurredOn: string;
  dueOn?: string;
  unitId?: string;
  patientId?: string;
};

export async function createFinancialEntry(input: FinancialDraft) {
  return entrySchema.parse(await apiRequest<unknown>("/finance/entries", { method: "POST", body: JSON.stringify(input) }));
}

export async function updateFinancialEntry(id: string, input: FinancialDraft) {
  return entrySchema.parse(await apiRequest<unknown>(`/finance/entries/${id}`, { method: "PATCH", body: JSON.stringify(input) }));
}

export async function settleFinancialEntry(id: string, paymentMethod: PaymentMethod, paymentReference?: string, settledOn?: string) {
  return entrySchema.parse(await apiRequest<unknown>(`/finance/entries/${id}/settle`, {
    method: "POST", headers: { "Idempotency-Key": typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `clini-${Date.now()}` },
    body: JSON.stringify({ paymentMethod, paymentReference: paymentReference || undefined, settledOn }),
  }));
}

export async function cancelFinancialEntry(id: string, reason: string) {
  return entrySchema.parse(await apiRequest<unknown>(`/finance/entries/${id}/cancel`, {
    method: "POST", body: JSON.stringify({ reason }),
  }));
}
