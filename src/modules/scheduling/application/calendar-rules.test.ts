import { describe, expect, it } from "vitest";

import { addDays, addDaysAsIsoInstant, addHour, composeAppointmentNotes, formatRangeLabel, instant, localDate, nextDate, rangeEnd } from "./calendar-rules";

describe("agenda calendar rules", () => {
  it("uses local dates and produces an ISO instant from a local appointment time", () => {
    expect(localDate(new Date(2026, 8, 16, 23, 59))).toBe("2026-09-16");
    expect(instant("2026-09-16", "09:30")).toMatch(/^2026-09-16T/);
  });

  it("calculates the range without mixing view policy into the component", () => {
    expect(nextDate("2026-09-16")).toBe("2026-09-17");
    expect(addDays("2026-09-16", 7)).toBe("2026-09-23");
    expect(addDaysAsIsoInstant("2026-09-16", 1)).toMatch(/^2026-09-17T/);
    expect(rangeEnd("2026-09-16", "day")).toBe("2026-09-17");
    expect(rangeEnd("2026-09-16", "week")).toBe("2026-09-23");
    expect(rangeEnd("2026-09-16", "month")).toBe("2026-10-16");
    expect(formatRangeLabel("2026-09-16", "day")).toContain("16");
  });

  it("keeps appointment time and notes composition deterministic", () => {
    expect(addHour("23:30")).toBe("00:30");
    expect(composeAppointmentNotes("  retorno  ", "Avaliação")).toBe("Procedimento: Avaliação\nretorno");
    expect(composeAppointmentNotes("", undefined)).toBe("");
  });
});
