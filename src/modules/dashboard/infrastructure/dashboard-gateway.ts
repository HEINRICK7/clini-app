import { getDashboardOverview } from "@/modules/dashboard/api";
import type { DashboardGateway } from "@/modules/dashboard/application/dashboard-gateway";

export const dashboardGateway: DashboardGateway = {
  getOverview: getDashboardOverview,
};
