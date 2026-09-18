"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useId, type ComponentType } from "react";

type SelectIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export type RelatedSelectOption = { value: string; label: string };

export type RelatedSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: RelatedSelectOption[];
  placeholder?: string;
  emptyHref?: string;
  emptyLabel?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  icon?: SelectIcon;
  id?: string;
};

export function relatedSelectDefaults(label: string): Pick<RelatedSelectProps, "emptyHref" | "emptyLabel" | "emptyDescription"> {
  const normalized = label.toLocaleLowerCase("pt-BR");
  if (normalized.includes("paciente")) return { emptyHref: "/patients", emptyLabel: "Cadastrar paciente", emptyDescription: "Cadastre um paciente para continuar." };
  if (normalized.includes("documento")) return { emptyHref: "/more?section=documents", emptyLabel: "Cadastrar documento", emptyDescription: "Cadastre um documento relacionado para continuar." };
  if (normalized.includes("procedimento planejado") || normalized.includes("item do tratamento") || normalized.includes("tratamento")) return { emptyHref: "/more?section=treatments", emptyLabel: "Abrir tratamentos", emptyDescription: "Crie o tratamento ou o item relacionado antes de continuar." };
  if (normalized.includes("procedimento")) return { emptyHref: "/more?section=catalog", emptyLabel: "Cadastrar procedimento", emptyDescription: "Cadastre um procedimento no catálogo para continuar." };
  if (normalized.includes("unit") || normalized.includes("local de atendimento")) return { emptyHref: "/more?section=units", emptyLabel: "Configurar local", emptyDescription: "Configure um local de atendimento para continuar." };
  return {};
}

export function RelatedSelect({ label, value, onChange, options, placeholder = "Selecione", emptyHref, emptyLabel = "Adicionar cadastro", emptyDescription, emptyAction, loading = false, disabled = false, required = false, icon: Icon, id }: RelatedSelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hasOptions = options.length > 0;
  const isEmpty = !loading && !hasOptions;
  const canAdd = isEmpty && !disabled && (emptyHref || emptyAction);

  return <div className="grid gap-1.5 text-sm font-semibold">
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={fieldId}>{label}</label>
      {canAdd ? emptyAction ? <button className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-primary hover:bg-blue-50" onClick={emptyAction.onClick} type="button"><Plus aria-hidden={true} className="h-4 w-4" />{emptyAction.label}</button> : <Link className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-primary hover:bg-blue-50" href={emptyHref!}><Plus aria-hidden={true} className="h-4 w-4" />{emptyLabel}</Link> : null}
    </div>
    <div className="relative">
      {Icon ? <Icon aria-hidden={true} className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-primary" /> : null}
      <select className={`min-h-12 w-full rounded-xl border border-border bg-surface px-4 text-base font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground ${Icon ? "pl-10" : ""}`} disabled={disabled || loading || !hasOptions} id={fieldId} onChange={(event) => onChange(event.target.value)} required={required} value={value}>
        <option value="">{loading ? "Carregando…" : hasOptions ? placeholder : "Nenhum item cadastrado"}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
    {isEmpty && emptyDescription ? <p className="text-xs font-normal leading-5 text-muted-foreground">{emptyDescription}</p> : null}
  </div>;
}
