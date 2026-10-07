"use client";

import type { OrthodonticApplianceType, Treatment } from "@/app/services";
import Link from "next/link";
import { Card } from "@/components/ui/card";

const orthodonticTerms = /ortodont|aparelho|alinhador/i;

export function isOrthodonticTreatment(treatment: Pick<Treatment, "category" | "name" | "notes" | "plannedProcedures">) {
  return treatment.category === "ORTHODONTIC" || orthodonticTerms.test([
    treatment.name,
    treatment.notes ?? "",
    ...treatment.plannedProcedures.map((procedure) => procedure.name),
  ].join(" "));
}

export function OrthodonticTreatmentVisual({ treatment }: { treatment: Treatment }) {
  const procedures = treatment.plannedProcedures.filter((procedure) => procedure.status !== "CANCELED");
  const completed = procedures.filter((procedure) => procedure.status === "COMPLETED").length;
  const progress = procedures.length ? Math.round((completed / procedures.length) * 100) : 0;
  const nextProcedure = procedures.find((procedure) => procedure.status !== "COMPLETED");
  const applianceType = treatment.applianceType ?? inferLegacyApplianceType(treatment) ?? "OTHER";

  return <Card className="grid min-w-0 gap-4 overflow-hidden border-cyan-200 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_76%)] p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(12rem,0.8fr)] sm:p-4">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-800">Ortodontia</span>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-navy shadow-sm">{treatmentStatusLabel(treatment.status)}</span>
      </div>
      <h4 className="mt-1 break-words text-base font-bold text-brand-navy">{treatment.name}</h4>
      <div className="mt-3 rounded-xl border border-cyan-100 bg-white/90 p-3">
        <p className="text-sm font-semibold text-brand-navy">{applianceLabel(applianceType)}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Consulte e registre bráquetes, bandas e movimentos por dente no odontograma clínico.</p>
        <Link className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-cyan-200 px-3 text-sm font-semibold text-brand-navy hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" href={`/more?section=odontogram&patientId=${encodeURIComponent(treatment.patientId)}`}>
          Abrir odontograma clínico
        </Link>
      </div>
    </div>

    <div className="min-w-0 rounded-xl border border-cyan-100 bg-white/90 p-3 sm:p-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Etapas do plano</p>
          {procedures.length ? <p className="mt-0.5 text-xl font-bold leading-tight text-brand-navy">{completed}<span className="text-sm font-semibold text-muted-foreground">/{procedures.length}</span></p> : <p className="mt-1 text-sm font-bold leading-tight text-brand-navy">Sem etapas</p>}
        </div>
        {procedures.length ? <span className="text-sm font-bold text-cyan-800">{progress}%</span> : null}
      </div>
      <div aria-label={procedures.length ? `${progress}% das etapas concluídas` : undefined} aria-valuemax={procedures.length ? 100 : undefined} aria-valuemin={procedures.length ? 0 : undefined} aria-valuenow={procedures.length ? progress : undefined} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role={procedures.length ? "progressbar" : undefined}>
        <div className="h-full rounded-full bg-cyan-600 transition-[width]" style={{ width: `${progress}%` }} />
      </div>
      {nextProcedure ? <p className="mt-2 line-clamp-2 text-xs leading-4 text-muted-foreground"><span className="font-semibold text-brand-navy">{nextProcedure.status === "IN_PROGRESS" ? "Em andamento:" : "Próxima etapa:"}</span> {nextProcedure.name}</p> : procedures.length ? <p className="mt-2 text-xs font-semibold text-success">Todas as etapas cadastradas foram concluídas</p> : <p className="mt-2 text-xs leading-4 text-muted-foreground">Cadastre as etapas para acompanhar o andamento.</p>}
    </div>
  </Card>;
}

function inferLegacyApplianceType(treatment: Pick<Treatment, "name" | "notes" | "plannedProcedures">): OrthodonticApplianceType | null {
  const content = [treatment.name, treatment.notes ?? "", ...treatment.plannedProcedures.map((procedure) => procedure.name)].join(" ");
  if (/alinhador|invisalign|placa transparente/i.test(content)) return "CLEAR_ALIGNER";
  if (/remov[ií]vel/i.test(content)) return "REMOVABLE";
  if (/aparelho fixo|met[aá]lico|bracket/i.test(content)) return "FIXED";
  return null;
}

function applianceLabel(type: OrthodonticApplianceType) {
  return ({ FIXED: "Aparelho fixo", CLEAR_ALIGNER: "Alinhador transparente", REMOVABLE: "Aparelho removível", OTHER: "Aparelho ortodôntico" })[type];
}

function treatmentStatusLabel(status: Treatment["status"]) {
  return ({ PLANNED: "Planejado", ACTIVE: "Em andamento", PAUSED: "Pausado", COMPLETED: "Concluído", CANCELED: "Cancelado" })[status];
}
