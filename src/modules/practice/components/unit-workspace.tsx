"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";
import {
  createUnit,
  deactivateUnit,
  listUnits,
  makeUnitPrimary,
  type UnitDraft,
} from "@/modules/practice/api";

const initialDraft: UnitDraft = {
  name: "",
  city: "",
  address: "",
  phone: "",
  whatsapp: "",
};

export function UnitWorkspace() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<UnitDraft>(initialDraft);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const unitsQuery = useQuery({
    queryKey: ["units"],
    queryFn: listUnits,
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: createUnit,
    onSuccess: async () => {
      setDraft(initialDraft);
      setFormMessage("Unidade adicionada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["units"] });
    },
    onError: (error) => setFormMessage(getErrorMessage(error)),
  });

  const primaryMutation = useMutation({
    mutationFn: makeUnitPrimary,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["units"] }),
    onError: (error) => setFormMessage(getErrorMessage(error)),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateUnit,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["units"] }),
    onError: (error) => setFormMessage(getErrorMessage(error)),
  });

  function handleDraftChange(field: keyof UnitDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    setFormMessage(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);
    createMutation.mutate(draft);
  }

  if (unitsQuery.isPending) {
    return <Card className="p-5"><p className="text-sm text-muted-foreground">Carregando suas unidades…</p></Card>;
  }

  if (unitsQuery.isError && unitsQuery.error instanceof ApiError && unitsQuery.error.status === 401) {
    return (
      <Card className="p-5">
        <h2 className="text-lg font-bold">Entre para configurar seus locais</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          O cadastro de unidades fica disponível apenas para o dentista proprietário autenticado.
        </p>
      </Card>
    );
  }

  if (unitsQuery.isError) {
    return <Card className="p-5"><p className="text-sm text-danger">Não foi possível carregar suas unidades.</p></Card>;
  }

  const units = unitsQuery.data;
  const isBusy = createMutation.isPending || primaryMutation.isPending || deactivateMutation.isPending;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
      <Card className="p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-sm font-semibold text-primary">Seu espaço de trabalho</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">Onde você atende?</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Cadastre os locais onde você atende. Cada local terá sua própria rotina.
          </p>
        </div>

        <form className="grid gap-3" onSubmit={handleSubmit}>
          <Field label="Nome da unidade" required value={draft.name} onChange={(value) => handleDraftChange("name", value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cidade" value={draft.city ?? ""} onChange={(value) => handleDraftChange("city", value)} />
            <Field label="Telefone" value={draft.phone ?? ""} onChange={(value) => handleDraftChange("phone", value)} />
          </div>
          <Field label="Endereço" value={draft.address ?? ""} onChange={(value) => handleDraftChange("address", value)} />
          <Field label="WhatsApp" value={draft.whatsapp ?? ""} onChange={(value) => handleDraftChange("whatsapp", value)} />
          {formMessage ? <p aria-live="polite" className="rounded-xl bg-cyan-50 px-3 py-2 text-sm text-brand-navy">{formMessage}</p> : null}
          <Button disabled={isBusy || !draft.name.trim()} type="submit">
            {createMutation.isPending ? "Salvando…" : "Adicionar unidade"}
          </Button>
        </form>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Unidades cadastradas</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight">Sua rede de atendimento</h2>
          </div>
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">{units.length}</span>
        </div>
        {units.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-5 text-sm leading-6 text-muted-foreground">
            Nenhuma unidade cadastrada ainda. Você pode começar pelo local onde atende com mais frequência.
          </p>
        ) : (
          <div className="grid gap-3">
            {units.map((unit) => (
              <article className="rounded-2xl border border-border p-4" key={unit.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{unit.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{unit.city ?? "Cidade não informada"}</p>
                  </div>
                  <span className={unit.status === "ACTIVE" ? "rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-success" : "rounded-full bg-surface-muted px-2 py-1 text-xs font-bold text-muted-foreground"}>
                    {unit.status === "ACTIVE" ? "Ativa" : "Inativa"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {unit.primary ? <span className="rounded-full bg-cyan-50 px-2 py-1 text-xs font-bold text-primary-strong">Principal</span> : null}
                  {unit.status === "ACTIVE" && !unit.primary ? (
                    <Button disabled={isBusy} onClick={() => primaryMutation.mutate(unit.id)} size="sm" variant="outline">Definir como principal</Button>
                  ) : null}
                  {unit.status === "ACTIVE" ? (
                    <Button disabled={isBusy} onClick={() => deactivateMutation.mutate(unit.id)} size="sm" variant="ghost">Desativar</Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

function Field({ label, required = false, value, onChange }: { label: string; required?: boolean; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold">
      <span>{label}{required ? " *" : ""}</span>
      <input className="min-h-12 rounded-xl border border-border bg-surface px-4 text-base font-normal outline-none transition focus:border-primary focus:ring-4 focus:ring-cyan-100" onChange={(event) => onChange(event.target.value)} required={required} value={value} />
    </label>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Não foi possível concluir a operação.";
}
