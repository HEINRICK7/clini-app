import { OperationalShell } from "@/app/operational-shell";
import { PatientWorkspace } from "@/modules/patient/components/patient-workspace";

export default function PatientsPage() {
  return <OperationalShell><PatientWorkspace /></OperationalShell>;
}
