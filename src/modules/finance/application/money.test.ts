import { describe, expect, it } from "vitest";

import { formatMoney, parseMoney, today } from "./money";

describe("finance money rules", () => {
  it("parses Brazilian monetary input into cents", () => {
    expect(parseMoney("1.234,56")).toBe(123456);
    expect(parseMoney("189,90")).toBe(18990);
    expect(parseMoney("invalido")).toBe(0);
  });

  it("formats cents for the Brazilian locale", () => {
    expect(formatMoney(18990)).toBe("R$ 189,90");
  });

  it("uses the UTC date required by the financial API", () => {
    expect(today(new Date("2026-09-17T02:00:00.000Z"))).toBe("2026-09-17");
  });
});
