export type DashboardAppointment = {
  id: string;
  unitId: string;
  unitName: string;
  patientId: string;
  patientName: string;
  startsAt: string;
  endsAt: string;
  type: string;
  status: string;
};

export type DashboardOverview = {
  date: string;
  unitId: string | null;
  activePatients: number;
  appointmentsToday: number;
  pendingReturns: number;
  upcomingAppointments: DashboardAppointment[];
  financial: {
    incomeCents: number;
    expenseCents: number;
    balanceCents: number;
    openIncomeCents: number;
    openExpenseCents: number;
    totalItems: number;
  };
};
