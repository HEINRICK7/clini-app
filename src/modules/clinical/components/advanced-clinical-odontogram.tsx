"use client";

import {
  disablePersistence,
  getChartMode,
  getPlanChart,
  getStatusChart,
  importStatus,
  OdontogramShell,
  onStateChange,
  setChartMode,
  setPlanChart,
  type OdontogramThemeConfig,
} from "react-advanced-odontogram";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";

import type { AdvancedOdontogramPayload } from "@/modules/clinical/odontogram-api";
import { Button } from "@/components/ui/button";
import { OrthodonticApplianceOdontogram } from "./orthodontic-appliance-odontogram";
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
  const [activeChart, setActiveChart] = useState<{ mode: "status" | "plan"; chart: unknown }>({ mode: "status", chart: EMPTY_STATUS_CHART });
  const payloadRef = useRef(initialPayload);
  const savedChartSignatureRef = useRef<string | null>(null);
  const chartCanvasRef = useRef<HTMLDivElement>(null);

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
      savedChartSignatureRef.current = chartSignature(getStatusChart(), getPlanChart());
      setActiveChart({ mode: "status", chart: cloneChart(getStatusChart()) });
      setDirty(false);
      setReady(true);
      unsubscribe = onStateChange(() => {
        const mode = getChartMode();
        const statusChart = getStatusChart();
        const planChart = getPlanChart();
        setDirty(chartSignature(statusChart, planChart) !== savedChartSignatureRef.current);
        setActiveChart({ mode, chart: cloneChart(mode === "plan" ? planChart : statusChart) });
      });
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
      savedChartSignatureRef.current = chartSignature(payload.statusChart, payload.planChart);
      setDirty(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar o odontograma.");
    }
  }

  return <section aria-label="Odontograma clínico avançado" className="grid min-w-0 gap-3" data-testid="advanced-clinical-odontogram">
    <header className="grid gap-3 rounded-xl border border-border bg-surface p-3 sm:flex sm:items-center sm:justify-between sm:p-4">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-brand-navy sm:text-lg">Odontograma clínico</h2>
        {!readOnly ? <div aria-live="polite" className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{version ? `Versão ${version}` : "Nenhum registro salvo"}</span>
          {savedAt ? <><span aria-hidden="true">·</span><time dateTime={savedAt}>Salvo em {new Date(savedAt).toLocaleString("pt-BR")}</time></> : null}
          <span aria-live="polite" className={dirty ? "font-semibold text-warning" : "text-success"} data-testid="odontogram-save-state">
            {dirty ? "Alterações sem salvar" : ready ? version ? "Tudo salvo" : "Sem alterações" : "Carregando dados clínicos…"}
          </span>
        </div> : null}
      </div>
      {!readOnly ? <Button className="w-full sm:w-auto" data-testid="save-advanced-odontogram" disabled={!ready || !dirty || saving} onClick={saveChart} type="button">
        {saving ? "Salvando…" : "Salvar odontograma"}
      </Button> : <span className="w-fit rounded-full bg-surface-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">Somente leitura</span>}
    </header>

    {saveError ? <p aria-live="assertive" className="rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-sm text-danger">{saveError}</p> : null}
    <p className="text-sm leading-5 text-muted-foreground">{readOnly ? "Visualização do prontuário. Para registrar ou alterar informações, abra a aba Tratamentos." : "Selecione um dente para registrar condições, tratamentos e planejamento. Salve para atualizar o prontuário."}</p>
    <div className="clini-advanced-chart-library min-w-0 rounded-xl border border-border bg-white p-2 sm:p-4" data-testid="advanced-odontogram-library">
      <ToothGridScrollControls targetRef={chartCanvasRef} />
      <div className="clini-advanced-chart-canvas min-w-0" ref={chartCanvasRef}>
        <OdontogramShell
          enableIcdas
          language="pt-br"
          numberingSystem="FDI"
          readOnly={!ready || readOnly || saving}
          showOrthoCard
          themeConfig={themeConfig}
        />
        <OrthodonticApplianceOdontogram chartMode={activeChart.mode} chartState={activeChart.chart} targetRef={chartCanvasRef} />
      </div>
    </div>
  </section>;
}

function ToothGridScrollControls({ targetRef }: { targetRef: RefObject<HTMLDivElement | null> }) {
  const [scrollState, setScrollState] = useState({ visible: false, canScrollLeft: false, canScrollRight: false });

  useEffect(() => {
    const host = targetRef.current;
    if (!host) return;

    let grid: HTMLElement | null = null;
    const resizeObserver = new ResizeObserver(update);
    const syncObservedGrid = () => {
      const nextGrid = host.querySelector<HTMLElement>("#toothGrid");
      if (nextGrid === grid) return;
      if (grid) {
        grid.removeEventListener("scroll", update);
        resizeObserver.unobserve(grid);
      }
      grid = nextGrid;
      if (grid) {
        grid.addEventListener("scroll", update, { passive: true });
        resizeObserver.observe(grid);
      }
    };
    function update() {
      syncObservedGrid();
      const visible = Boolean(grid && grid.clientWidth > 0 && grid.scrollWidth > grid.clientWidth + 1);
      const next = {
        visible,
        canScrollLeft: visible && Boolean(grid && grid.scrollLeft > 1),
        canScrollRight: visible && Boolean(grid && grid.scrollLeft + grid.clientWidth < grid.scrollWidth - 1),
      };
      setScrollState((previous) => previous.visible === next.visible
        && previous.canScrollLeft === next.canScrollLeft
        && previous.canScrollRight === next.canScrollRight
        ? previous
        : next);
    }

    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    resizeObserver.observe(host);
    window.addEventListener("resize", update, { passive: true });
    update();

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      grid?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetRef]);

  function scroll(direction: -1 | 1) {
    const grid = targetRef.current?.querySelector<HTMLElement>("#toothGrid");
    grid?.scrollBy({ left: direction * grid.clientWidth * 0.8, behavior: "smooth" });
  }

  if (!scrollState.visible) return null;

  return <div aria-label="Navegação pelos dentes" className="clini-tooth-grid-scroll-controls" data-testid="odontogram-horizontal-navigation" role="group">
    <p>Deslize a arcada ou use as setas para ver todos os dentes.</p>
    <div className="flex shrink-0 gap-1.5">
      <Button aria-label="Rolar arcada para a esquerda" className="h-11 min-h-11 w-11 px-0" disabled={!scrollState.canScrollLeft} onClick={() => scroll(-1)} variant="outline"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></Button>
      <Button aria-label="Rolar arcada para a direita" className="h-11 min-h-11 w-11 px-0" disabled={!scrollState.canScrollRight} onClick={() => scroll(1)} variant="outline"><ChevronRight aria-hidden="true" className="h-5 w-5" /></Button>
    </div>
  </div>;
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

function chartSignature(statusChart: unknown, planChart: unknown): string {
  return JSON.stringify({ statusChart, planChart });
}
