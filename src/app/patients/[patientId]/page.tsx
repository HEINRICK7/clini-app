import { OperationalShell } from "@/app/operational-shell";
import { PatientProfileScreen } from "@/modules/patient/components/patient-profile-screen";

export default async function PatientProfilePage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  return <OperationalShell><PatientProfileScreen patientId={patientId} /></OperationalShell>;
}
