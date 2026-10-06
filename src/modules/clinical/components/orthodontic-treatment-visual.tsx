import type { OrthodonticApplianceType, Treatment } from "@/app/services";

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

  return <section aria-label={`Resumo visual: ${treatment.name}`} className="overflow-hidden rounded-2xl border border-cyan-200 bg-[linear-gradient(135deg,#ecfeff_0%,#ffffff_76%)] p-4">
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)]">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-800">Ortodontia</span>
          <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-bold text-brand-navy shadow-sm">{treatmentStatusLabel(treatment.status)}</span>
        </div>
        <h4 className="mt-1 truncate text-base font-bold text-brand-navy">{treatment.name}</h4>
        <OrthodonticIllustration type={applianceType} />
        <p className="mt-1 text-center text-xs font-medium text-muted-foreground">{applianceLabel(applianceType)} · ilustração</p>
      </div>

      <div className="min-w-0 rounded-xl border border-cyan-100 bg-white/90 p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Etapas do plano</p>
            {procedures.length ? <p className="mt-0.5 text-xl font-bold leading-tight text-brand-navy">{completed}<span className="text-sm font-semibold text-muted-foreground">/{procedures.length}</span></p> : <p className="mt-1 text-sm font-bold leading-tight text-brand-navy">Sem etapas</p>}
          </div>
          {procedures.length ? <span className="text-sm font-bold text-cyan-800">{progress}%</span> : null}
        </div>
        <div aria-label={procedures.length ? `${progress}% das etapas concluídas` : undefined} className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role={procedures.length ? "progressbar" : undefined} aria-valuemin={procedures.length ? 0 : undefined} aria-valuemax={procedures.length ? 100 : undefined} aria-valuenow={procedures.length ? progress : undefined}>
          <div className="h-full rounded-full bg-cyan-600 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
        {nextProcedure ? <p className="mt-2 line-clamp-2 text-xs leading-4 text-muted-foreground"><span className="font-semibold text-brand-navy">{nextProcedure.status === "IN_PROGRESS" ? "Em andamento:" : "Próxima etapa:"}</span> {nextProcedure.name}</p> : procedures.length ? <p className="mt-2 text-xs font-semibold text-success">Todas as etapas cadastradas foram concluídas</p> : <p className="mt-2 text-xs leading-4 text-muted-foreground">Cadastre as etapas para acompanhar o andamento.</p>}
      </div>
    </div>
  </section>;
}

function OrthodonticIllustration({ type }: { type: OrthodonticApplianceType }) {
  const teeth = [
    { x: 30, y: 31, w: 29, h: 42, r: -9 },
    { x: 62, y: 22, w: 29, h: 47, r: -6 },
    { x: 94, y: 15, w: 30, h: 50, r: -3 },
    { x: 127, y: 12, w: 31, h: 51, r: -1 },
    { x: 162, y: 12, w: 31, h: 51, r: 1 },
    { x: 196, y: 15, w: 30, h: 50, r: 3 },
    { x: 229, y: 22, w: 29, h: 47, r: 6 },
    { x: 261, y: 31, w: 29, h: 42, r: 9 },
  ];

  const ariaLabel = ({ FIXED: "Dentes com aparelho fixo", CLEAR_ALIGNER: "Dentes com alinhador transparente", REMOVABLE: "Dentes com aparelho removível", OTHER: "Dentes com aparelho ortodôntico" })[type];

  return <svg aria-label={ariaLabel} className="mt-2 h-auto w-full" role="img" viewBox="0 0 320 94">
    <path d="M16 52 Q160 2 304 52 Q284 88 160 87 Q36 88 16 52Z" fill="#fda4af" fillOpacity=".45" />
    {teeth.map(({ x, y, w, h, r }) => <g key={x} transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}>
      <rect fill="#fff" height={h} rx="8" stroke="#cbd5e1" strokeWidth="1.5" width={w} x={x} y={y} />
      <path d={`M${x + 5} ${y + h - 8}h${w - 10}`} stroke="#e2e8f0" strokeWidth="1.5" />
    </g>)}
    {type === "FIXED" ? <>
      <path d="M23 51 Q160 40 297 51" fill="none" stroke="#0e7490" strokeLinecap="round" strokeWidth="3.5" />
      {teeth.map(({ x, y, w }) => <g key={`bracket-${x}`}>
        <rect fill="#e0f2fe" height="12" rx="2" stroke="#0369a1" strokeWidth="1.5" width="12" x={x + (w - 12) / 2} y={y + 19} />
        <path d={`M${x + w / 2 - 3} ${y + 25}h6`} stroke="#0369a1" strokeWidth="1.2" />
      </g>)}
    </> : type === "CLEAR_ALIGNER" ? <path d="M17 49 Q160 8 303 49 L291 72 Q160 45 29 72Z" fill="#67e8f9" fillOpacity=".48" stroke="#0891b2" strokeLinejoin="round" strokeWidth="2.5" /> : type === "REMOVABLE" ? <>
      <path d="M20 62 Q160 98 300 62 L290 75 Q160 107 30 75Z" fill="#f9a8d4" fillOpacity=".82" stroke="#be185d" strokeWidth="2" />
      <path d="M25 56 Q160 85 295 56" fill="none" stroke="#0e7490" strokeLinecap="round" strokeWidth="2.5" />
    </> : <path d="M18 50 Q160 15 302 50 L294 67 Q160 34 26 67Z" fill="#a5f3fc" fillOpacity=".5" stroke="#0891b2" strokeWidth="2.5" />}
  </svg>;
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
