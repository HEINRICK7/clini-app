"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type OrthodonticToothState = { orthoAppliance?: unknown };
type ChartState = { teeth?: Record<string, OrthodonticToothState> };
type ToothPoint = { tooth: number; x: number; y: number };
type WireLayout = { width: number; height: number; upper: ToothPoint[]; lower: ToothPoint[] };

export function OrthodonticApplianceOdontogram({ chartState, chartMode, targetRef }: {
  chartState: unknown;
  chartMode: "status" | "plan";
  targetRef: RefObject<HTMLDivElement | null>;
}) {
  const layoutRef = useRef("");
  const [layout, setLayout] = useState<WireLayout | null>(null);

  useEffect(() => {
    const host = targetRef.current;
    if (!host) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const hostBounds = host.getBoundingClientRect();
        if (!hostBounds.width || !hostBounds.height) return;

        const teeth = getOrthodonticTeeth(chartState);
        const upper: ToothPoint[] = [];
        const lower: ToothPoint[] = [];
        host.querySelectorAll<HTMLElement>(".tooth-tile.side-view[data-tooth]").forEach((tile) => {
          const tooth = Number(tile.dataset.tooth);
          if (!Number.isInteger(tooth) || !teeth.has(tooth)) return;

          const toothVisual = tile.querySelector<HTMLElement>(".tooth-svg") ?? tile;
          const toothBounds = toothVisual.getBoundingClientRect();
          const x = toothBounds.left + toothBounds.width / 2 - hostBounds.left;
          const y = toothBounds.top + toothBounds.height / 2 - hostBounds.top;
          if (x < 0 || x > hostBounds.width) return;

          const point = { tooth, x, y };
          (tooth < 30 ? upper : lower).push(point);
        });

        upper.sort((a, b) => a.x - b.x);
        lower.sort((a, b) => a.x - b.x);
        const next = { width: hostBounds.width, height: hostBounds.height, upper, lower };
        const snapshot = JSON.stringify(next);
        if (snapshot === layoutRef.current) return;
        layoutRef.current = snapshot;
        setLayout(next);
      });
    };
    const onScroll = (event: Event) => {
      if (event.target instanceof HTMLElement && event.target.id === "toothGrid") measure();
    };

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(host);
    host.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", measure, { passive: true });
    measure();

    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", measure);
    };
  }, [chartMode, chartState, targetRef]);

  if (!layout || (layout.upper.length < 2 && layout.lower.length < 2)) return null;

  return <svg aria-label="Fio ortodôntico entre dentes com bráquetes ou bandas" className="orthodontic-wire-overlay" data-chart-mode={chartMode} data-testid="orthodontic-wire" height={layout.height} role="img" viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width}>
    {layout.upper.length > 1 ? <path className="orthodontic-wire upper" d={wirePath(layout.upper)} /> : null}
    {layout.lower.length > 1 ? <path className="orthodontic-wire lower" d={wirePath(layout.lower)} /> : null}
  </svg>;
}

function getOrthodonticTeeth(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return new Set<number>();
  const teeth = (value as ChartState).teeth;
  if (!teeth || typeof teeth !== "object") return new Set<number>();
  return new Set(Object.entries(teeth)
    .filter(([, state]) => state?.orthoAppliance === "bracket" || state?.orthoAppliance === "band")
    .map(([tooth]) => Number(tooth))
    .filter(Number.isInteger));
}

function wirePath(points: ToothPoint[]) {
  return points.map((point, index) => `${index ? "L" : "M"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
}
