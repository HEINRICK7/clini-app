"use client";

import { OdontogramChartSurface, OdontogramProvider } from "react-advanced-odontogram";
import { useEffect, useRef, useState } from "react";

import type { OrthodonticApplianceType } from "@/app/services";
import "./orthodontic-odontogram.css";

type BracketPoint = { tooth: number; x: number; y: number; size: number };
type WireLayout = { width: number; height: number; upper: BracketPoint[]; lower: BracketPoint[] };

const themeConfig = {
  colors: {
    background: "#ffffff",
    panel: "#ffffff",
    card: "#ffffff",
    text: "#0b2d5b",
    muted: "#64748b",
    line: "#dbe4ee",
    accent: "#2563eb",
    accent2: "#00a9c7",
  },
};

export function OrthodonticApplianceOdontogram({ applianceType }: { applianceType: OrthodonticApplianceType }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const lastLayoutRef = useRef("");
  const [layout, setLayout] = useState<WireLayout | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const selectTooth = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const tile = target.closest<HTMLElement>(".tooth-tile.side-view[data-tooth]");
      if (!tile || tile.classList.contains("placeholder")) return;
      const tooth = Number(tile.dataset.tooth);
      if (Number.isInteger(tooth)) setSelectedTooth(tooth);
    };

    host.addEventListener("click", selectTooth, true);
    return () => host.removeEventListener("click", selectTooth, true);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = host.getBoundingClientRect();
        const upper: BracketPoint[] = [];
        const lower: BracketPoint[] = [];

        host.querySelectorAll<HTMLElement>(".tooth-tile.side-view[data-tooth]").forEach((tile) => {
          const tooth = Number(tile.dataset.tooth);
          if (!Number.isInteger(tooth)) return;
          const toothVisual = tile.querySelector<HTMLElement>(".tooth-svg") ?? tile;
          const toothBounds = toothVisual.getBoundingClientRect();
          const tileBounds = tile.getBoundingClientRect();
          const point = {
            tooth,
            x: toothBounds.left + toothBounds.width / 2 - bounds.left,
            y: toothBounds.top + toothBounds.height / 2 - bounds.top,
            size: Math.max(5, Math.min(14, tileBounds.width * 0.36)),
          };
          (tooth < 30 ? upper : lower).push(point);
        });

        upper.sort((a, b) => a.x - b.x);
        lower.sort((a, b) => a.x - b.x);
        const next = { width: bounds.width, height: bounds.height, upper, lower };
        const snapshot = JSON.stringify(next);
        if (snapshot === lastLayoutRef.current) return;
        lastLayoutRef.current = snapshot;
        setLayout(next);
      });
    };

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(host);
    window.addEventListener("resize", measure, { passive: true });
    measure();

    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const label = applianceLabel(applianceType);
  return <div aria-label={`${label}: arcada dentária`} className="clini-orthodontic-odontogram" data-orthodontic-odontogram ref={hostRef}>
    <div className="orthodontic-arch-caption" aria-hidden="true"><span>Arcada superior</span><span>Arcada inferior</span></div>
    <OdontogramProvider language="pt-br" numberingSystem="FDI" themeConfig={themeConfig}>
      <OdontogramChartSurface />
    </OdontogramProvider>
    <div className="orthodontic-tooth-selection" aria-live="polite" aria-atomic="true" data-testid="orthodontic-tooth-selection">
      {selectedTooth ? <>
        <span><strong>Dente {selectedTooth} selecionado</strong><small>Seleção visual para consulta.</small></span>
        <button aria-label="Limpar dente selecionado" onClick={() => setSelectedTooth(null)} type="button">Limpar</button>
      </> : <span>Toque em um dente para selecioná-lo.</span>}
    </div>
    {layout && layout.width > 0 && layout.height > 0 ? <svg aria-label={applianceDescription(applianceType)} className="orthodontic-wire-overlay" data-testid="orthodontic-wire" height={layout.height} role="img" viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width}>
      {applianceType === "FIXED" ? <>
        <path className="orthodontic-wire" d={wirePath(layout.upper)} />
        <path className="orthodontic-wire" d={wirePath(layout.lower)} />
        {[...layout.upper, ...layout.lower].map((point) => <g key={point.tooth}>
          <rect className="orthodontic-bracket" height={point.size * 0.78} rx={Math.max(1.5, point.size * 0.13)} width={point.size} x={point.x - point.size / 2} y={point.y - point.size * 0.39} />
          <path d={`M${point.x - point.size * 0.26} ${point.y}h${point.size * 0.52}`} fill="none" stroke="#087e9b" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </g>)}
      </> : null}
      {applianceType === "CLEAR_ALIGNER" ? <>
        <path className="orthodontic-aligner" d={wirePath(layout.upper)} />
        <path className="orthodontic-aligner" d={wirePath(layout.lower)} />
      </> : null}
      {applianceType === "REMOVABLE" ? <>
        <path className="orthodontic-wire" d={wirePath(layout.upper)} stroke="#be185d" strokeDasharray="5 3" />
        <path className="orthodontic-wire" d={wirePath(layout.lower)} stroke="#be185d" strokeDasharray="5 3" />
      </> : null}
    </svg> : null}
  </div>;
}

function wirePath(points: BracketPoint[]) {
  if (!points.length) return "";
  return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}

function applianceLabel(type: OrthodonticApplianceType) {
  return ({ FIXED: "Aparelho fixo", CLEAR_ALIGNER: "Alinhador transparente", REMOVABLE: "Aparelho removível", OTHER: "Aparelho ortodôntico" })[type];
}

function applianceDescription(type: OrthodonticApplianceType) {
  return ({ FIXED: "Arcada com bráquetes e fio ortodôntico", CLEAR_ALIGNER: "Arcada com alinhador transparente", REMOVABLE: "Arcada com aparelho ortodôntico removível", OTHER: "Arcada com aparelho ortodôntico" })[type];
}
