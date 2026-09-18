import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const configurationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  procedureId: z.string().uuid(),
  unitId: z.string().uuid(),
  priceCents: z.number().int().nonnegative().nullable(),
  durationMinutes: z.number().int().positive().nullable(),
  updatedAt: z.string(),
});

const procedureSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  unitConfiguration: configurationSchema.nullable(),
});

const pageSchema = z.object({
  items: z.array(procedureSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type CatalogProcedure = z.infer<typeof procedureSchema>;

export async function listCatalogProcedures(input: { unitId?: string; query?: string; includeArchived?: boolean } = {}) {
  const fetchPage = async (page: number) => {
    const params = new URLSearchParams({ page: String(page), size: "50" });
    if (input.unitId) params.set("unitId", input.unitId);
    if (input.query?.trim()) params.set("q", input.query.trim());
    if (!input.includeArchived) params.set("status", "ACTIVE");
    return pageSchema.parse(await apiRequest<unknown>(`/catalog/procedures?${params.toString()}`));
  };
  const firstPage = await fetchPage(0);
  if (firstPage.totalPages <= 1) return firstPage;
  const remainingPages = await Promise.all(Array.from({ length: firstPage.totalPages - 1 }, (_, index) => fetchPage(index + 1)));
  const items = [firstPage, ...remainingPages].flatMap((page) => page.items);
  return { ...firstPage, items, size: items.length, totalPages: 1 };
}

export async function createCatalogProcedure(input: { name: string; description?: string }): Promise<CatalogProcedure> {
  return procedureSchema.parse(await apiRequest<unknown>("/catalog/procedures", {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function updateCatalogProcedure(id: string, input: { name: string; description?: string }): Promise<CatalogProcedure> {
  return procedureSchema.parse(await apiRequest<unknown>(`/catalog/procedures/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }));
}

export async function archiveCatalogProcedure(id: string): Promise<CatalogProcedure> {
  return procedureSchema.parse(await apiRequest<unknown>(`/catalog/procedures/${id}/archive`, { method: "POST" }));
}

export async function configureCatalogProcedure(input: { procedureId: string; unitId: string; priceCents?: number | null; durationMinutes?: number | null }): Promise<CatalogProcedure> {
  return procedureSchema.parse(await apiRequest<unknown>(`/catalog/procedures/${input.procedureId}/units/${input.unitId}`, {
    method: "PUT",
    body: JSON.stringify({ priceCents: input.priceCents ?? null, durationMinutes: input.durationMinutes ?? null }),
  }));
}
