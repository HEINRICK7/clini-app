"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useId, useState, type KeyboardEvent } from "react";

import { useCliniServices } from "@/app/service-container";
import type { Patient } from "@/app/services";

type PatientPickerProps = {
  label: string;
  value: string;
  onChange: (patientId: string) => void;
  onPatientChange?: (patient: Patient | null) => void;
  unitId?: string;
  status?: Patient["status"];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function PatientPicker({ label, value, onChange, onPatientChange, unitId, status, required = false, disabled = false, placeholder = "Buscar por nome, telefone, CPF ou e-mail" }: PatientPickerProps) {
  const { patient: patientService } = useCliniServices();
  const inputId = useId();
  const labelId = useId();
  const listId = useId();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [chosenPatient, setChosenPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const selectedQuery = useQuery({
    queryKey: ["patient-picker-selected", value],
    queryFn: () => patientService.getPatient(value),
    enabled: Boolean(value) && chosenPatient?.id !== value,
    retry: false,
  });
  const selectedPatient = chosenPatient?.id === value ? chosenPatient : selectedQuery.data;
  const searchQuery = useQuery({
    queryKey: ["patients", "picker", debouncedSearch, unitId ?? "", status ?? ""],
    queryFn: () => patientService.listPatients(debouncedSearch, 0, 20, { unitId, status }),
    enabled: isOpen && debouncedSearch.length >= 2,
    retry: false,
  });
  const isDebouncing = search.trim() !== debouncedSearch;
  const results = isDebouncing ? [] : searchQuery.data?.items ?? [];

  function choosePatient(patient: Patient) {
    setChosenPatient(patient);
    setSearch("");
    setIsOpen(false);
    setIsSearching(false);
    setActiveIndex(0);
    onChange(patient.id);
    onPatientChange?.(patient);
  }

  function clearSelection() {
    setChosenPatient(null);
    setSearch("");
    setIsOpen(false);
    setIsSearching(false);
    onChange("");
    onPatientChange?.(null);
  }

  function startSearch() {
    setSearch("");
    setIsOpen(true);
    setIsSearching(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setIsSearching(false);
      setSearch("");
      return;
    }
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choosePatient(results[activeIndex] ?? results[0]);
    }
  }

  return <div className="grid min-w-0 gap-1.5 text-sm font-semibold">
    <label id={labelId} htmlFor={selectedPatient && !isSearching ? undefined : inputId}>{label}{required ? <span aria-hidden="true"> *</span> : null}</label>
    {selectedPatient && !isSearching ? <div aria-labelledby={labelId} className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 sm:px-4" role="group">
      <span className="min-w-0 flex-1 truncate text-base font-medium">{selectedPatient.fullName}</span>
      {selectedPatient.phone ? <span className="hidden shrink-0 text-xs font-normal text-muted-foreground sm:inline">{selectedPatient.phone}</span> : null}
      <button className="min-h-10 shrink-0 rounded-lg px-2 text-xs font-bold text-primary hover:bg-blue-50 disabled:opacity-50" disabled={disabled} onClick={startSearch} type="button">Alterar</button>
      {!required ? <button aria-label={`Limpar ${label.toLocaleLowerCase("pt-BR")}`} className="min-h-10 shrink-0 rounded-lg px-2 text-xs font-semibold text-muted-foreground hover:bg-surface-muted disabled:opacity-50" disabled={disabled} onClick={clearSelection} type="button">Limpar</button> : null}
    </div> : <>
      <input
        aria-activedescendant={isOpen && results[activeIndex] ? `${listId}-${results[activeIndex].id}` : undefined}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={isOpen && debouncedSearch.length >= 2}
        aria-labelledby={labelId}
        autoComplete="off"
        autoFocus={isSearching}
        className="min-h-12 min-w-0 w-full rounded-xl border border-border bg-surface px-3 text-base font-normal outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-muted sm:px-4"
        disabled={disabled}
        id={inputId}
        onChange={(event) => { setSearch(event.target.value); setActiveIndex(0); setIsOpen(true); }}
        onBlur={(event) => {
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) {
            setIsOpen(false);
            setIsSearching(false);
          }
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        role="combobox"
        value={search}
      />
      {isOpen ? <div className="relative">
        <div className="absolute inset-x-0 top-0 z-30 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-border bg-surface p-1 shadow-lg">
          {debouncedSearch.length < 2 ? <p className="px-3 py-3 text-sm font-normal leading-5 text-muted-foreground" role="status">Digite pelo menos 2 caracteres para buscar.</p> : null}
          {debouncedSearch.length >= 2 && (isDebouncing || searchQuery.isFetching) ? <p className="px-3 py-3 text-sm font-normal text-muted-foreground" role="status">Buscando pacientes…</p> : null}
          {debouncedSearch.length >= 2 && !isDebouncing && searchQuery.isError ? <p className="px-3 py-3 text-sm font-normal text-danger" role="status">Não foi possível buscar pacientes. Tente novamente.</p> : null}
          {debouncedSearch.length >= 2 && !isDebouncing && !searchQuery.isFetching && !searchQuery.isError && results.length === 0 ? <div className="px-3 py-3 text-sm font-normal text-muted-foreground" role="status">Nenhum paciente encontrado. <Link className="font-semibold text-primary underline" href="/patients">Cadastrar paciente</Link></div> : null}
          <div aria-label={`Resultados de ${label.toLocaleLowerCase("pt-BR")}`} id={listId} role="listbox">
            {results.map((patient, index) => <button
            aria-selected={index === activeIndex}
            className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left font-normal ${index === activeIndex ? "bg-cyan-50 text-brand-navy" : "hover:bg-surface-muted"}`}
            id={`${listId}-${patient.id}`}
            key={patient.id}
            onClick={() => choosePatient(patient)}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => setActiveIndex(index)}
            role="option"
            type="button"
            ><span className="min-w-0 truncate font-semibold">{patient.fullName}</span><span className="shrink-0 text-xs text-muted-foreground">{patient.phone ?? patient.email ?? "Paciente"}</span></button>)}
          </div>
        </div>
      </div> : null}
    </>}
  </div>;
}
