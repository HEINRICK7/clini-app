import { describe, expect, it } from "vitest";

import { buildInstallments } from "./installments";

describe("budget installment rules", () => {
  it("splits the total and distributes remainder cents deterministically", () => {
    expect(buildInstallments(10001, 1, 0, 3, "2026-09-17")).toEqual([
      { number: 1, amountCents: 3334, dueOn: "2026-09-17" },
      { number: 2, amountCents: 3334, dueOn: "2026-10-17" },
      { number: 3, amountCents: 3333, dueOn: "2026-11-17" },
    ]);
  });

  it("does not create a schedule for one installment or an invalid total", () => {
    expect(buildInstallments(100, 1, 0, 1, "2026-09-17")).toBeUndefined();
    expect(buildInstallments(1, 1, 0, 2, "2026-09-17")).toBeUndefined();
  });
});
