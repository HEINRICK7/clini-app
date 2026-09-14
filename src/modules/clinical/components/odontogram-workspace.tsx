"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { listPatients } from "@/modules/patient/api";
import {
  archiveOdontogram,
  createOdontogram,
  createOdontogramVersion,
  getOdontogram,
  type OdontogramDentition,
  type OdontogramFindingType,
  type OdontogramSurface,
  type OdontogramToothInput,
  type OdontogramToothStatus,
} from "@/modules/clinical/odontogram-api";

const dentitions: { value: OdontogramDentition; label: string }[] = [
  { value: "PERMANENT", label: "Permanente" },
  { value: "DECIDUOUS", label: "Decíduo" },
];
const toothStatuses: { value: OdontogramToothStatus; label: string }[] = [
  { value: "PRESENT", label: "Presente" },
  { value: "MISSING", label: "Ausente" },
  { value: "IMPLANT", label: "Implante" },
  { value: "UNERUPTED", label: "Não erupcionado" },
  { value: "SUPERNUMERARY", label: "Supranumerário" },
  { value: "UNKNOWN", label: "Não informado" },
];
const findingTypes: { value: OdontogramFindingType; label: string }[] = [
  { value: "CARIES", label: "Cárie" },
  { value: "RESTORATION", label: "Restauração" },
  { value: "FRACTURE", label: "Fratura" },
  { value: "ROOT_CANAL", label: "Tratamento endodôntico" },
  { value: "CROWN", label: "Coroa" },
  { value: "PROSTHESIS", label: "Prótese" },
  { value: "ABSCESS", label: "Abscesso" },
  { value: "WEAR", label: "Desgaste" },
  { value: "OTHER", label: "Outro" },
];
const surfaces: { value: OdontogramSurface; label: string }[] = [
  { value: "MESIAL", label: "Mesial" },
  { value: "DISTAL", label: "Distal" },
  { value: "OCCLUSAL", label: "Oclusal" },
  { value: "INCISAL", label: "Incisal" },
  { value: "BUCCAL", label: "Vestibular" },
  { value: "LINGUAL", label: "Lingual" },
  { value: "PALATAL", label: "Palatina" },
  { value: "CERVICAL", label: "Cervical" },
];

export function OdontogramWorkspace() {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [teeth, setTeeth] = useState<OdontogramToothInput[]>([]);
  const [number, setNumber] = useState("");
  const [dentition, setDentition] = useState<OdontogramDentition>("PERMANENT");
  const [status, setStatus] = useState<OdontogramToothStatus>("PRESENT");
  const [toothNotes, setToothNotes] = useState("");
  const [finding, setFinding] = useState<OdontogramFindingType | "">("");
  const [surface, setSurface] = useState<OdontogramSurface | "">("");
  const [findingNotes, setFindingNotes] = useState("");
  const [reason, setReason] = useState("");
  const [draftTouched, setDraftTouched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "odontogram"], queryFn: () => listPatients(), retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const patient = patients.find((item) => item.id === patientId);
  const odontogramQuery = useQuery({ queryKey: ["odontogram", patientId], queryFn: () => getOdontogram(patientId), enabled: Boolean(patientId), retry: false });
  const odontogram = odontogramQuery.data;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["odontogram", patientId] });
  const mutationError = (error: unknown) => setMessage(error instanceof ApiError ? error.message : "Não foi possível salvar o odontograma.");
  const persistedTeeth: OdontogramToothInput[] = odontogram?.teeth.map((tooth) => ({ number: tooth.number, dentition: tooth.dentition, status: tooth.status, notes: tooth.notes ?? undefined, findings: tooth.findings.map((item) => ({ type: item.type, surface: item.surface ?? undefined, notes: item.notes ?? undefined })) })) ?? [];
  const draftTeeth = draftTouched ? teeth : persistedTeeth;
  const saveMutation = useMutation({
    mutationFn: () => odontogram ? createOdontogramVersion(odontogram.id, { unitId: patient?.currentUnitId ?? "", reason: reason || undefined, teeth: draftTeeth }) : createOdontogram({ patientId, unitId: patient?.currentUnitId ?? "", reason: reason || undefined, teeth: draftTeeth }),
    onSuccess: async (saved) => { setReason(""); setDraftTouched(false); setMessage(`Versão ${saved.version} do odontograma salva.`); await refresh(); },
    onError: mutationError,
  });
  const archiveMutation = useMutation({ mutationFn: () => archiveOdontogram(odontogram?.id ?? ""), onSuccess: async () => { setMessage("Odontograma arquivado sem apagar o histórico."); await refresh(); }, onError: mutationError });

  function addTooth() {
    const toothNumber = Number(number);
    if (!Number.isInteger(toothNumber) || toothNumber < 11 || toothNumber > 85) { setMessage("Informe um número FDI válido para o dente."); return; }
    const input: OdontogramToothInput = { number: toothNumber, dentition, status, notes: toothNotes || undefined, findings: finding ? [{ type: finding, surface: surface || undefined, notes: findingNotes || undefined }] : [] };
    setTeeth((current) => [...(draftTouched ? current : persistedTeeth).filter((item) => !(item.number === toothNumber && item.dentition === dentition)), input].sort((left, right) => left.number - right.number));
    setDraftTouched(true);
    setNumber(""); setToothNotes(""); setFindingNotes(""); setMessage("Dente preparado para a próxima versão.");
  }

  if (odontogramQuery.isError && !(odontogramQuery.error instanceof ApiError && odontogramQuery.error.status === 404)) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar o odontograma.</p></Card>;
  const archived = odontogram?.status === "ARCHIVED";
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]"><Card className="p-5 sm:p-6"><p className="text-sm font-semibold text-primary">Registro odontológico</p><h2 className="mt-1 text-xl font-bold tracking-tight">Odontograma</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Registre a condição dos dentes e os achados por versão, preservando o histórico clínico.</p><div className="mt-5 grid gap-3"><ClinicalSelect label="Paciente" value={patientId} onChange={(value) => { setPatientId(value); setDraftTouched(false); setTeeth([]); setMessage(null); }} options={patients.map((item) => ({ value: item.id, label: item.fullName }))} /><ClinicalField label="Motivo da atualização" value={reason} onChange={setReason} placeholder="Ex.: avaliação inicial" /><Button disabled={!patientId || archived || saveMutation.isPending} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? "Salvando…" : odontogram ? `Salvar versão ${odontogram.version + 1}` : "Criar odontograma"}</Button>{archived ? <Button disabled variant="outline">Odontograma arquivado</Button> : null}{odontogram && !archived ? <Button disabled={archiveMutation.isPending} onClick={() => archiveMutation.mutate()} size="sm" variant="outline">Arquivar sem excluir</Button> : null}{message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}</div></Card><Card className="p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Mapa dentário</p><h2 className="mt-1 text-xl font-bold tracking-tight">Dentes e achados</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{draftTeeth.length} registrados</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ClinicalField label="Número FDI" value={number} onChange={setNumber} placeholder="Ex.: 16" /><ClinicalSelect label="Dentição" value={dentition} onChange={(value) => setDentition(value as OdontogramDentition)} options={dentitions} /><ClinicalSelect label="Condição" value={status} onChange={(value) => setStatus(value as OdontogramToothStatus)} options={toothStatuses} /><ClinicalSelect label="Achado" value={finding} onChange={(value) => setFinding(value as OdontogramFindingType)} options={findingTypes} /><ClinicalSelect label="Superfície (opcional)" value={surface} onChange={(value) => setSurface(value as OdontogramSurface | "")} options={surfaces} /><ClinicalField label="Observação do dente" value={toothNotes} onChange={setToothNotes} placeholder="Opcional" /><ClinicalField label="Observação do achado" value={findingNotes} onChange={setFindingNotes} placeholder="Opcional" /></div><Button className="mt-3 w-full sm:w-auto" disabled={archived} onClick={addTooth} size="sm" variant="outline">Adicionar ou atualizar dente</Button><div className="mt-4 grid gap-2 sm:grid-cols-2">{draftTeeth.map((tooth) => <article className="rounded-xl border border-border bg-surface-muted p-3" key={`${tooth.dentition}-${tooth.number}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Dente {tooth.number} · {tooth.dentition === "PERMANENT" ? "permanente" : "decíduo"}</p><p className="mt-1 font-semibold">{toothStatuses.find((item) => item.value === tooth.status)?.label}</p></div><span className="text-xs text-muted-foreground">{tooth.findings.length} achado(s)</span></div>{tooth.notes ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{tooth.notes}</p> : null}{tooth.findings.length ? <ul className="mt-2 grid gap-1 text-xs text-muted-foreground">{tooth.findings.map((item) => <li key={`${item.type}-${item.surface ?? "general"}`}>{findingTypes.find((option) => option.value === item.type)?.label}{item.surface ? ` · ${surfaces.find((option) => option.value === item.surface)?.label}` : ""}</li>)}</ul> : null}</article>)}</div>{!draftTeeth.length ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Nenhum dente registrado nesta versão. Isso é válido para iniciar o prontuário e completar depois.</p> : null}</Card></section>;
}

function ClinicalSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><select className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Selecione</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function ClinicalField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><input className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>; }
