"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useCliniServices } from "@/app/service-container";
import { Card } from "@/components/ui/card";
import { CliniOdontogram } from "@/modules/clinical/presentation/odontogram/components/clini-odontogram";

export function OdontogramWorkspace() {
  const { patient: patientService } = useCliniServices();
  const [patientId, setPatientId] = useState("");
  const patientsQuery = useQuery({ queryKey: ["patients", "odontogram"], queryFn: () => patientService.listPatients("", 0, 50), retry: false });
  const patients = (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE");
  const patient = patients.find((item) => item.id === patientId);

  return <section className="grid gap-4">
    <Card className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Registro odontológico</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Odontograma do paciente</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Selecione um paciente para visualizar os 32 dentes permanentes, consultar o histórico e registrar ações clínicas.</p><label className="mt-5 grid max-w-xl gap-1.5 text-sm font-semibold"><span>Paciente</span><select className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal" onChange={(event) => setPatientId(event.target.value)} value={patientId}><option value="">Selecione um paciente ativo</option>{patients.map((item) => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label></Card>
    {patient ? <CliniOdontogram patientId={patient.id} unitId={patient.currentUnitId} /> : <Card className="p-5 text-sm text-muted-foreground">O mapa dentário aparecerá depois da seleção do paciente.</Card>}
  </section>;
}
