import { z } from "zod";

import { apiRequest } from "@/lib/api/client";
import type { DashboardOverview } from "./application/contracts";

export type { DashboardOverview } from "./application/contracts";

const appointmentSchema = z.object({
  id: z.string().uuid(),
  unitId: z.string().uuid(),
  unitName: z.string(),
  patientId: z.string().uuid(),
  patientName: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  type: z.string(),
  status: z.string(),
});

const overviewSchema = z.object({
  date: z.string(),
  unitId: z.string().uuid().nullable(),
  activePatients: z.number().int(),
  appointmentsToday: z.number().int(),
  upcomingAppointments: z.array(appointmentSchema),
  financial: z.object({
    incomeCents: z.number().int(),
    expenseCents: z.number().int(),
    balanceCents: z.number().int(),
    openIncomeCents: z.number().int(),
    openExpenseCents: z.number().int(),
    totalItems: z.number().int(),
  }),
});

export async function getDashboardOverview(input: { unitId?: string; date: string } ): Promise<DashboardOverview> {
  const params = new URLSearchParams({ date: input.date });
  if (input.unitId) params.set("unitId", input.unitId);
  return overviewSchema.parse(await apiRequest<unknown>(`/dashboard/overview?${params.toString()}`));
}
