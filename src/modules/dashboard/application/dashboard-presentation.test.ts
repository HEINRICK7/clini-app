import { describe, expect, it } from "vitest";

import {
  activeUnits,
  formatDashboardDate,
  formatMoney,
  greetingForHour,
  localCalendarDate,
  resolveCurrentUnitId,
} from "./dashboard-presentation";

describe("dashboard presentation rules", () => {
  it("uses the local calendar instead of UTC for the displayed day", () => {
    expect(localCalendarDate(new Date(2026, 8, 16, 23, 59))).toBe("2026-09-16");
  });

  it("selects active units and preserves the primary fallback", () => {
    const units = [
      { id: "inactive", status: "INACTIVE", primary: true },
      { id: "active", status: "ACTIVE", primary: false },
    ];
    expect(activeUnits(units)).toEqual([{ id: "active", status: "ACTIVE", primary: false }]);
    expect(resolveCurrentUnitId(undefined, [{ id: "active", primary: true }])).toBe("active");
    expect(resolveCurrentUnitId("chosen", units)).toBe("chosen");
  });

  it("keeps greeting and currency formatting outside the component", () => {
    expect(greetingForHour(11)).toBe("Bom dia");
    expect(greetingForHour(14)).toBe("Boa tarde");
    expect(greetingForHour(20)).toBe("Boa noite");
    expect(formatMoney(8990)).toContain("89,90");
    expect(formatDashboardDate("2026-09-16")).toContain("16");
  });
});
