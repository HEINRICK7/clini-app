import { OperationalShell } from "@/app/operational-shell";
import { AppointmentFlowWorkspace } from "@/modules/clinical/components/appointment-flow-workspace";

export default function StartAppointmentPage() {
  return <OperationalShell><AppointmentFlowWorkspace /></OperationalShell>;
}
