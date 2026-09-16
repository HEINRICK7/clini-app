import type { DashboardOverview } from "./contracts";

export type DashboardGateway = {
  getOverview: (input: { unitId?: string; date: string }) => Promise<DashboardOverview>;
};
