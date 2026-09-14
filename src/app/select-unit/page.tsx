"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AuthGate, useAuthSession, useCurrentUnit } from "@/modules/auth/components/auth-gate";

export default function SelectUnitPage() {
  return <AuthGate><SelectUnitScreen /></AuthGate>;
}

function SelectUnitScreen() {
  const router = useRouter();
  const session = useAuthSession();
  const { selectedUnitId, selectUnit } = useCurrentUnit();
  const activeUnits = session.units.filter((unit) => unit.status === "ACTIVE");
  const [unitId, setUnitId] = useState(selectedUnitId ?? activeUnits.find((unit) => unit.primary)?.id ?? activeUnits[0]?.id ?? "");

  return <main className="flex min-h-screen justify-center bg-background px-5 py-8 sm:px-6"><div className="flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col"><div className="mb-7 pt-8"><p className="text-sm font-semibold text-primary">Seu espaço de atendimento</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-navy">Onde você vai atender agora?</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Escolha um local para continuar.</p></div><div className="grid gap-3">{activeUnits.map((unit) => { const selected = unit.id === unitId; return <button aria-pressed={selected} className={`flex min-h-20 items-center gap-3 rounded-2xl border bg-surface p-4 text-left transition-colors ${selected ? "border-primary bg-blue-50/50" : "border-border hover:bg-surface-muted"}`} key={unit.id} onClick={() => setUnitId(unit.id)} type="button"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${selected ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground"}`}>{selected ? <Check aria-hidden="true" className="h-5 w-5" /> : <MapPin aria-hidden="true" className="h-5 w-5" />}</span><span className="min-w-0 flex-1"><span className="block font-semibold text-brand-navy">{unit.name}</span><span className="mt-1 block text-xs text-muted-foreground">{unit.primary ? "Local principal" : "Local de atendimento"}{selected ? " · Selecionado" : ""}</span></span></button>; })}</div><Button className="mt-auto w-full" disabled={!unitId} onClick={() => { selectUnit(unitId); router.replace("/"); }}>{"Continuar"}</Button></div></main>;
}
