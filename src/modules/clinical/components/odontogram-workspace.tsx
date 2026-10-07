"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { useCliniServices } from "@/app/service-container";
import { Card } from "@/components/ui/card";
import { CliniOdontogram } from "@/modules/clinical/presentation/odontogram/components/clini-odontogram";
import { PatientPicker } from "@/modules/patient/components/patient-picker";

export function OdontogramWorkspace() {
  const { patient: patientService } = useCliniServices();
  const searchParams = useSearchParams();
  const requestedPatientId = searchParams.get("patientId") ?? "";
  const [selectedPatientId, setSelectedPatientId] = useState(requestedPatientId);
  const patientId = requestedPatientId || selectedPatientId;
  const patientQuery = useQuery({ queryKey: ["patient", "odontogram", patientId], queryFn: () => patientService.getPatient(patientId), enabled: Boolean(patientId), retry: false });
  const patient = patientQuery.data;

  return <section className="grid gap-4">
    <Card className="p-4 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Registro odontológico</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Odontograma do paciente</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Selecione um paciente para registrar dentes permanentes e decíduos, consultar o histórico e documentar achados clínicos.</p><div className="mt-5 max-w-xl"><PatientPicker label="Paciente" status="ACTIVE" value={patientId} onChange={setSelectedPatientId} placeholder="Buscar paciente" /></div></Card>
    {patient ? <CliniOdontogram patientId={patient.id} unitId={patient.currentUnitId} /> : <Card className="p-5 text-sm text-muted-foreground">O mapa dentário aparecerá depois da seleção do paciente.</Card>}
  </section>;
}
