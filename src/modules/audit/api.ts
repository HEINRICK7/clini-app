import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const entrySchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitId: z.string().uuid().nullable(),
  actorUserId: z.string().uuid().nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().uuid().nullable(),
  requestId: z.string().nullable(),
  details: z.string().nullable(),
  occurredAt: z.string(),
});

const pageSchema = z.object({ items: z.array(entrySchema), page: z.number(), size: z.number(), totalItems: z.number(), totalPages: z.number() });

export type AuditEntry = z.infer<typeof entrySchema>;

export async function listAuditEvents(): Promise<z.infer<typeof pageSchema>> {
  return pageSchema.parse(await apiRequest<unknown>("/audit/events?size=20"));
}
