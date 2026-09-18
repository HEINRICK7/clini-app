"use client";

import { useState } from "react";

type DateOfBirthFieldProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
}>;

export function DateOfBirthField({ value, onChange }: DateOfBirthFieldProps) {
  const [draft, setDraft] = useState(() => ({ isoValue: value, displayValue: isoToDisplay(value) }));
  const displayValue = draft.isoValue === value ? draft.displayValue : isoToDisplay(value);
  const isoValue = displayToIso(displayValue);
  const hasCompleteValue = displayValue.length === 10;

  function handleChange(nextValue: string) {
    const formattedValue = formatInput(nextValue);
    const nextIsoValue = displayToIso(formattedValue);
    setDraft({ isoValue: nextIsoValue, displayValue: formattedValue });
    onChange(nextIsoValue);
  }

  return <label className="grid min-w-0 gap-1.5 text-sm font-semibold">
    <span>Data de nascimento</span>
    <input aria-invalid={hasCompleteValue && !isoValue} autoComplete="bday" className="min-h-12 min-w-0 w-full rounded-xl border border-border bg-surface px-4 text-base font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" inputMode="numeric" maxLength={10} onChange={(event) => handleChange(event.target.value)} placeholder="dd/mm/aaaa" type="text" value={displayValue} />
    <span className="text-xs font-normal leading-5 text-muted-foreground">Digite no formato dia/mês/ano.</span>
  </label>;
}

function formatInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isoToDisplay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : formatInput(value);
}

function displayToIso(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}
