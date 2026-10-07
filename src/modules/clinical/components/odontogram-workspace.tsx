"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useCliniServices } from "@/app/service-container";
import { Card } from "@/components/ui/card";
import { RelatedSelect } from "@/components/ui/related-select";
import { CliniOdontogram } from "@/modules/clinical/presentation/odontogram/components/clini-odontogram";

export function OdontogramWorkspace() {
  const { patient: patientService } = useCliniServices();
  const searchParams = useSearchParams();
  const requestedPatientId = searchParams.get("patientId") ?? "";
  const [selectedPatientId, setSelectedPatientId] = useState(requestedPatientId);
  const patientId = requestedPatientId || selectedPatientId;
  const patientsQuery = useQuery({ queryKey: ["patients", "odontogram"], queryFn: () => patientService.listPatients("", 0, 50), retry: false });
  const requestedPatientQuery = useQuery({ queryKey: ["patient", "odontogram", requestedPatientId], queryFn: () => patientService.getPatient(requestedPatientId), enabled: Boolean(requestedPatientId), retry: false });
  const patients = useMemo(() => {
    const listed = (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE");
    const contextual = requestedPatientQuery.data?.status === "ACTIVE" ? [requestedPatientQuery.data] : [];
    return [...new Map([...contextual, ...listed].map((patient) => [patient.id, patient])).values()];
  }, [patientsQuery.data, requestedPatientQuery.data]);
  const patient = requestedPatientQuery.data ?? patients.find((item) => item.id === patientId);

  return <section className="grid gap-4">
    <Card className="p-4 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Registro odontológico</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Odontograma do paciente</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Selecione um paciente para registrar dentes permanentes e decíduos, consultar o histórico e documentar achados clínicos.</p><div className="mt-5 max-w-xl"><RelatedSelect emptyDescription="Cadastre um paciente para abrir o odontograma." emptyHref="/patients" emptyLabel="Cadastrar paciente" label="Paciente" loading={patientsQuery.isPending} onChange={setSelectedPatientId} options={patients.map((item) => ({ value: item.id, label: item.fullName }))} placeholder="Selecione um paciente ativo" value={patientId} /></div></Card>
    {patient ? <CliniOdontogram patientId={patient.id} unitId={patient.currentUnitId} /> : <Card className="p-5 text-sm text-muted-foreground">O mapa dentário aparecerá depois da seleção do paciente.</Card>}
  </section>;
}
