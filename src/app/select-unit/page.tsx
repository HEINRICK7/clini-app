"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

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

  return <main className="flex min-h-[100dvh] justify-center bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]"><div className="flex w-full max-w-[22rem] flex-1 flex-col"><header className="pt-16"><h1 className="max-w-[17rem] text-2xl font-bold leading-[1.2] tracking-tight text-brand-navy">Onde você vai atender agora?</h1><p className="mt-2 max-w-[19rem] text-sm leading-5 text-muted-foreground">Escolha um local ou continue com o último utilizado.</p></header><div className="mt-6 grid gap-3">{activeUnits.map((unit) => { const selected = unit.id === unitId; return <button aria-pressed={selected} className={`flex min-h-[4.5rem] items-center gap-3 rounded-xl border bg-surface p-3.5 text-left transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? "border-primary bg-blue-50/50" : "border-border"}`} key={unit.id} onClick={() => setUnitId(unit.id)} type="button"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-transparent"}`}>{selected ? <Check aria-hidden="true" className="h-5 w-5" /> : null}</span><span className="min-w-0 flex-1"><span className="block truncate font-semibold text-brand-navy">{unit.name}</span><span className="mt-1 block text-xs text-muted-foreground">{unit.primary ? "Local principal" : "Local de atendimento"}</span>{selected ? <span className="mt-1 inline-flex rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-success">Selecionado</span> : null}</span></button>; })}</div><Button className="mt-auto w-full rounded-xl bg-brand-navy shadow-none hover:bg-primary" disabled={!unitId} onClick={() => { selectUnit(unitId); router.replace("/"); }}>{"Continuar"}</Button></div></main>;
}
