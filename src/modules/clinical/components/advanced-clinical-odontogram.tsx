"use client";

import {
  disablePersistence,
  getPlanChart,
  getStatusChart,
  importStatus,
  OdontogramShell,
  onStateChange,
  setChartMode,
  setPlanChart,
  type OdontogramThemeConfig,
} from "react-advanced-odontogram";
import { useEffect, useRef, useState } from "react";

import type { AdvancedOdontogramPayload } from "@/modules/clinical/odontogram-api";
import { Button } from "@/components/ui/button";
import "./react-advanced-odontogram-vendor.css";
import "./advanced-clinical-odontogram.css";

const EMPTY_STATUS_CHART = cloneChart(getStatusChart());
const EMPTY_PLAN_CHART = cloneChart(getPlanChart());

const themeConfig: OdontogramThemeConfig = {
  colors: {
    accent: "#155eef",
    accent2: "#0891b2",
    background: "#f7f9fc",
    card: "#ffffff",
    line: "#d9e1ec",
    muted: "#61728a",
    panel: "#ffffff",
    text: "#12315b",
  },
};

type Props = {
  patientId: string;
  initialPayload: unknown;
  version: number | null;
  savedAt?: string;
  readOnly: boolean;
  saving: boolean;
  onSave: (payload: AdvancedOdontogramPayload) => Promise<unknown>;
};

export function AdvancedClinicalOdontogram({ patientId, initialPayload, version, savedAt, readOnly, saving, onSave }: Props) {
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const payloadRef = useRef(initialPayload);

  useEffect(() => {
    payloadRef.current = initialPayload;
  }, [initialPayload]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let disposed = false;
    const initialize = window.setTimeout(() => {
      if (disposed) return;
      disablePersistence();
      const saved = unpackPayload(payloadRef.current);
      importStatus(saved?.statusChart ?? EMPTY_STATUS_CHART);
      setPlanChart(saved?.planChart ?? EMPTY_PLAN_CHART);
      setChartMode("status");
      setDirty(false);
      setReady(true);
      unsubscribe = onStateChange(() => setDirty(true));
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(initialize);
      unsubscribe?.();
      disablePersistence();
    };
  }, [patientId]);

  async function saveChart() {
    setSaveError(null);
    const payload: AdvancedOdontogramPayload = {
      format: "clini-advanced-odontogram",
      version: 1,
      statusChart: cloneChart(getStatusChart()),
      planChart: cloneChart(getPlanChart()),
    };
    try {
      await onSave(payload);
      setDirty(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar o odontograma.");
    }
  }

  return <section aria-label="Odontograma clínico avançado" className="grid min-w-0 gap-3" data-testid="advanced-clinical-odontogram">
    <header className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:flex sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-brand-navy sm:text-lg">Odontograma clínico</h2>
        <div aria-live="polite" className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{version ? `Versão ${version}` : "Ainda não salvo"}</span>
          {savedAt ? <><span aria-hidden="true">·</span><time dateTime={savedAt}>Salvo em {new Date(savedAt).toLocaleString("pt-BR")}</time></> : null}
          <span aria-live="polite" className={dirty ? "font-semibold text-warning" : "text-success"} data-testid="odontogram-save-state">
            {dirty ? "Alterações sem salvar" : ready ? "Tudo salvo" : "Carregando dados clínicos…"}
          </span>
        </div>
      </div>
      {!readOnly ? <Button className="w-full sm:w-auto" data-testid="save-advanced-odontogram" disabled={!ready || !dirty || saving} onClick={saveChart} type="button">
        {saving ? "Salvando…" : "Salvar odontograma"}
      </Button> : <span className="w-fit rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">Somente leitura</span>}
    </header>

    {saveError ? <p aria-live="assertive" className="rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-sm text-danger">{saveError}</p> : null}
    <p className="text-sm leading-5 text-muted-foreground">Toque em um dente para registrar a condição ou o tratamento. No celular, deslize o mapa para percorrer a arcada. A periodontia fica na aba ao lado.</p>
    <div className="clini-advanced-chart-library min-w-0 rounded-xl border border-border bg-white p-2 sm:p-4" data-testid="advanced-odontogram-library">
      <div className="min-w-0">
        <OdontogramShell
          enableIcdas
          language="pt-br"
          numberingSystem="FDI"
          readOnly={!ready || readOnly || saving}
          showOrthoCard
          themeConfig={themeConfig}
        />
      </div>
    </div>
  </section>;
}

function unpackPayload(payload: unknown): { statusChart: unknown; planChart: unknown } | null {
  if (!isRecord(payload)) return null;
  if (payload.format === "clini-advanced-odontogram" && isRecord(payload.statusChart)) {
    return {
      statusChart: payload.statusChart,
      planChart: isRecord(payload.planChart) ? payload.planChart : EMPTY_PLAN_CHART,
    };
  }
  if (typeof payload.version === "string" && isRecord(payload.teeth)) {
    return { statusChart: payload, planChart: EMPTY_PLAN_CHART };
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneChart<T>(chart: T): T {
  return JSON.parse(JSON.stringify(chart)) as T;
}
