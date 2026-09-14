import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const unitSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  city: z.string().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  primary: z.boolean(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  timezone: z.string(),
});

const unitsSchema = z.array(unitSchema);

export type Unit = z.infer<typeof unitSchema>;

export type UnitDraft = {
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
};

export async function listUnits(): Promise<Unit[]> {
  const response = await apiRequest<unknown>("/units");
  return unitsSchema.parse(response);
}

export async function createUnit(input: UnitDraft): Promise<Unit> {
  const response = await apiRequest<unknown>("/units", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return unitSchema.parse(response);
}

export async function makeUnitPrimary(unitId: string): Promise<Unit> {
  const response = await apiRequest<unknown>(`/units/${unitId}/primary`, {
    method: "POST",
  });
  return unitSchema.parse(response);
}

export async function deactivateUnit(unitId: string): Promise<Unit> {
  const response = await apiRequest<unknown>(`/units/${unitId}/deactivate`, {
    method: "POST",
  });
  return unitSchema.parse(response);
}
