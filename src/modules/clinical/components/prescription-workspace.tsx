"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import { listPatients } from "@/modules/patient/api";
import { archivePrescription, closePrescription, createPrescription, listPrescriptions, rectifyPrescription, updatePrescription, type Prescription, type PrescriptionItemInput } from "@/modules/clinical/prescription-api";

export function PrescriptionWorkspace() {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [activeIngredient, setActiveIngredient] = useState("");
  const [concentration, setConcentration] = useState("");
  const [form, setForm] = useState("Comprimido");
  const [route, setRoute] = useState("Oral");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [quantity, setQuantity] = useState("");
  const [instructions, setInstructions] = useState("");
  const [items, setItems] = useState<PrescriptionItemInput[]>([]);
  const [reason, setReason] = useState("");
  const [rectifyReason, setRectifyReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const patientsQuery = useQuery({ queryKey: ["patients", "prescriptions"], queryFn: () => listPatients(), retry: false });
  const patients = useMemo(() => (patientsQuery.data?.items ?? []).filter((patient) => patient.status === "ACTIVE"), [patientsQuery.data]);
  const patient = patients.find((item) => item.id === patientId);
  const prescriptionsQuery = useQuery({ queryKey: ["prescriptions", patientId], queryFn: () => listPrescriptions(patientId), enabled: Boolean(patientId), retry: false });
  const prescriptions = prescriptionsQuery.data?.items ?? [];
  const selected = prescriptions.find((prescription) => prescription.id === selectedId);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["prescriptions", patientId] });
  const mutationError = (error: unknown) => setMessage(error instanceof ApiError ? error.message : "Não foi possível concluir a operação na prescrição.");
  const payloadItems = items;
  const saveMutation = useMutation({ mutationFn: () => selected?.status === "DRAFT" ? updatePrescription(selected.id, { unitId: patient?.currentUnitId ?? "", items: payloadItems, reason: reason || undefined }) : createPrescription({ patientId, unitId: patient?.currentUnitId ?? "", items: payloadItems, reason: reason || undefined }), onSuccess: async (saved) => { setSelectedId(saved.id); setItems(saved.items.map(toInput)); setReason(""); setMessage(`Prescrição salva na versão ${saved.version}.`); await refresh(); }, onError: mutationError });
  const closeMutation = useMutation({ mutationFn: () => closePrescription(selected?.id ?? ""), onSuccess: async () => { setMessage("Prescrição fechada e preservada."); await refresh(); }, onError: mutationError });
  const rectifyMutation = useMutation({ mutationFn: () => rectifyPrescription(selected?.id ?? "", payloadItems, rectifyReason), onSuccess: async (saved) => { setItems(saved.items.map(toInput)); setRectifyReason(""); setMessage(`Retificação registrada na versão ${saved.version}.`); await refresh(); }, onError: mutationError });
  const archiveMutation = useMutation({ mutationFn: () => archivePrescription(selected?.id ?? ""), onSuccess: async () => { setMessage("Prescrição arquivada sem apagar o histórico."); await refresh(); }, onError: mutationError });
  const busy = saveMutation.isPending || closeMutation.isPending || rectifyMutation.isPending || archiveMutation.isPending;

  function addItem() {
    if (!medicationName.trim() || !dosage.trim() || !frequency.trim()) { setMessage("Informe medicamento, dose e frequência."); return; }
    setItems((current) => [...current, { medicationName, activeIngredient: activeIngredient || undefined, concentration: concentration || undefined, pharmaceuticalForm: form || undefined, route: route || undefined, dosage, frequency, duration: duration || undefined, quantity: quantity || undefined, instructions: instructions || undefined }]);
    setMedicationName(""); setActiveIngredient(""); setConcentration(""); setDosage(""); setFrequency(""); setDuration(""); setQuantity(""); setInstructions(""); setMessage("Item adicionado à próxima versão.");
  }
  function selectPrescription(prescription: Prescription) { setSelectedId(prescription.id); setItems(prescription.items.map(toInput)); setMessage(null); }

  if (prescriptionsQuery.isError) return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar as prescrições.</p></Card>;
  const archived = selected?.status === "ARCHIVED";
  return <section className="grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"><Card className="p-5 sm:p-6"><p className="text-sm font-semibold text-primary">Conduta clínica</p><h2 className="mt-1 text-xl font-bold tracking-tight">Prescrições</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Itens, dose, frequência e instruções são preservados por versão. Assinatura digital não faz parte do escopo atual.</p><div className="mt-5 grid gap-3"><ClinicalSelect label="Paciente" value={patientId} onChange={(value) => { setPatientId(value); setSelectedId(""); setItems([]); setMessage(null); }} options={patients.map((item) => ({ value: item.id, label: item.fullName }))} /><ClinicalField label="Medicamento" value={medicationName} onChange={setMedicationName} placeholder="Ex.: Ibuprofeno 600 mg" /><ClinicalField label="Princípio ativo" value={activeIngredient} onChange={setActiveIngredient} placeholder="Opcional" /><div className="grid gap-3 sm:grid-cols-2"><ClinicalField label="Forma" value={form} onChange={setForm} placeholder="Comprimido" /><ClinicalField label="Via" value={route} onChange={setRoute} placeholder="Oral" /><ClinicalField label="Dose" value={dosage} onChange={setDosage} placeholder="1 comprimido" /><ClinicalField label="Frequência" value={frequency} onChange={setFrequency} placeholder="A cada 8 horas" /><ClinicalField label="Duração" value={duration} onChange={setDuration} placeholder="5 dias" /><ClinicalField label="Quantidade" value={quantity} onChange={setQuantity} placeholder="15 comprimidos" /></div><ClinicalField label="Instruções" value={instructions} onChange={setInstructions} placeholder="Tomar após as refeições" /><Button disabled={archived} onClick={addItem} size="sm" variant="outline">Adicionar item</Button><div className="grid gap-2">{items.map((item, index) => <div className="rounded-xl border border-border bg-surface-muted p-3 text-sm" key={`${item.medicationName}-${index}`}><div className="flex justify-between gap-2"><span className="font-semibold">{item.medicationName}</span><span className="text-xs text-muted-foreground">{item.frequency}</span></div><p className="mt-1 text-xs text-muted-foreground">{item.dosage}{item.duration ? ` · ${item.duration}` : ""}{item.route ? ` · ${item.route}` : ""}</p></div>)}</div><ClinicalField label="Motivo da versão" value={reason} onChange={setReason} placeholder="Opcional" /><Button disabled={!patientId || !items.length || busy} onClick={() => saveMutation.mutate()}>{saveMutation.isPending ? "Salvando…" : selected?.status === "DRAFT" ? "Salvar rascunho" : "Criar prescrição"}</Button>{selected?.status === "DRAFT" ? <Button disabled={busy} onClick={() => closeMutation.mutate()} size="sm" variant="outline">Fechar prescrição</Button> : null}{selected?.status === "CLOSED" ? <><ClinicalField label="Motivo da retificação" value={rectifyReason} onChange={setRectifyReason} placeholder="Obrigatório" /><Button disabled={busy || !rectifyReason.trim() || !items.length} onClick={() => rectifyMutation.mutate()} size="sm" variant="outline">Registrar retificação</Button></> : null}{selected && !archived ? <Button disabled={busy} onClick={() => archiveMutation.mutate()} size="sm" variant="outline">Arquivar sem excluir</Button> : null}{message ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm leading-5 text-brand-navy">{message}</p> : null}</div></Card><Card className="p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-primary">Histórico do Patient</p><h2 className="mt-1 text-xl font-bold tracking-tight">Prescrições versionadas</h2></div><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{prescriptions.length}</span></div>{!patientId ? <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">Selecione um paciente para começar.</p> : null}<div className="mt-4 grid gap-3">{prescriptions.map((prescription) => <button className={`rounded-2xl border p-4 text-left ${selectedId === prescription.id ? "border-primary bg-cyan-50/30" : "border-border"}`} key={prescription.id} onClick={() => selectPrescription(prescription)} type="button"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-primary">Prescrição</p><h3 className="mt-1 font-bold">{prescription.items.map((item) => item.medicationName).join(", ")}</h3></div><span className="text-xs text-muted-foreground">v{prescription.version} · {prescription.status}</span></div><p className="mt-2 text-sm leading-5 text-muted-foreground">{prescription.items.length} item(ns) · {prescription.items[0]?.dosage} · {prescription.items[0]?.frequency}</p></button>)}</div></Card></section>;
}

function toInput(item: Prescription["items"][number]): PrescriptionItemInput { return { medicationName: item.medicationName, activeIngredient: item.activeIngredient ?? undefined, concentration: item.concentration ?? undefined, pharmaceuticalForm: item.pharmaceuticalForm ?? undefined, route: item.route ?? undefined, dosage: item.dosage, frequency: item.frequency, duration: item.duration ?? undefined, quantity: item.quantity ?? undefined, instructions: item.instructions ?? undefined }; }
function ClinicalSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><select className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Selecione</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function ClinicalField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="grid gap-1.5 text-sm font-semibold"><span>{label}</span><input className="min-h-11 rounded-xl border border-border bg-surface px-3 text-sm font-normal" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>; }
