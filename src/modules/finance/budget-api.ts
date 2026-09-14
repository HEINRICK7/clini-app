import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const itemSchema = z.object({
  id: z.string().uuid(),
  catalogProcedureId: z.string().uuid().nullable(),
  description: z.string(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int(),
  lineTotalCents: z.number().int(),
});

const installmentEventSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["SETTLED", "CANCELED"]),
  amountCents: z.number().int(),
  effectiveOn: z.string(),
  paymentMethod: z.enum(["CASH", "PIX", "CARD", "BANK_TRANSFER", "OTHER"]).nullable(),
  paymentReference: z.string().nullable(),
  reason: z.string().nullable(),
  createdByUserId: z.string().uuid(),
  occurredAt: z.string(),
});

const installmentSchema = z.object({
  id: z.string().uuid(),
  number: z.number().int(),
  amountCents: z.number().int().positive(),
  dueOn: z.string(),
  status: z.enum(["OPEN", "SETTLED", "CANCELED"]),
  settledOn: z.string().nullable(),
  paymentMethod: z.enum(["CASH", "PIX", "CARD", "BANK_TRANSFER", "OTHER"]).nullable(),
  paymentReference: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  history: z.array(installmentEventSchema),
});

const budgetSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  patientId: z.string().uuid(),
  unitId: z.string().uuid(),
  treatmentId: z.string().uuid().nullable(),
  status: z.enum(["DRAFT", "APPROVED", "REJECTED", "CANCELED"]),
  title: z.string(),
  notes: z.string().nullable(),
  items: z.array(itemSchema),
  installments: z.array(installmentSchema),
  subtotalCents: z.number().int(),
  discountCents: z.number().int(),
  discountPercent: z.number().nullable(),
  discountReason: z.string().nullable(),
  totalCents: z.number().int(),
  statusReason: z.string().nullable(),
  statusChangedAt: z.string().nullable(),
  createdByUserId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const pageSchema = z.object({
  items: z.array(budgetSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type Budget = z.infer<typeof budgetSchema>;
export type BudgetStatus = Budget["status"];
export type BudgetPaymentMethod = NonNullable<z.infer<typeof installmentSchema>["paymentMethod"]>;

export async function listBudgets(input: { patientId?: string; unitId?: string; status?: BudgetStatus; page?: number; size?: number } = {}) {
  const { page = 0, size = 30, ...filters } = input;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  params.set("page", String(page));
  params.set("size", String(size));
  return pageSchema.parse(await apiRequest<unknown>(`/finance/budgets?${params.toString()}`));
}

export type BudgetDraft = {
  patientId: string;
  unitId: string;
  title: string;
  notes?: string;
  items: Array<{ catalogProcedureId?: string; description?: string; quantity: number; unitPriceCents?: number }>;
  installments?: Array<{ number: number; amountCents: number; dueOn: string }>;
  discountCents?: number;
  discountReason?: string;
};

export async function createBudget(input: BudgetDraft) {
  return budgetSchema.parse(await apiRequest<unknown>("/finance/budgets", { method: "POST", body: JSON.stringify(input) }));
}

export async function approveBudget(id: string) {
  return budgetSchema.parse(await apiRequest<unknown>(`/finance/budgets/${id}/approve`, { method: "POST" }));
}

export async function rejectBudget(id: string, reason: string) {
  return budgetSchema.parse(await apiRequest<unknown>(`/finance/budgets/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }));
}

export async function cancelBudget(id: string, reason: string) {
  return budgetSchema.parse(await apiRequest<unknown>(`/finance/budgets/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }));
}

export async function settleBudgetInstallment(budgetId: string, installmentId: string, paymentMethod: BudgetPaymentMethod,
  paymentReference?: string, settledOn?: string) {
  const key = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `clini-${Date.now()}`;
  return budgetSchema.parse(await apiRequest<unknown>(`/finance/budgets/${budgetId}/installments/${installmentId}/settle`, {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: JSON.stringify({ paymentMethod, paymentReference: paymentReference || undefined, settledOn }),
  }));
}

export async function cancelBudgetInstallment(budgetId: string, installmentId: string, reason: string) {
  return budgetSchema.parse(await apiRequest<unknown>(`/finance/budgets/${budgetId}/installments/${installmentId}/cancel`, {
    method: "POST", body: JSON.stringify({ reason }),
  }));
}
