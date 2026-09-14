import { OperationalShell } from "@/app/operational-shell";
import { NewAppointmentScreen } from "@/modules/scheduling/components/new-appointment-screen";

export default function NewAppointmentPage() {
  return <OperationalShell><NewAppointmentScreen /></OperationalShell>;
}
