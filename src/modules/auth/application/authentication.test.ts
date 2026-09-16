import { describe, expect, it, vi } from "vitest";

import { authenticate, destinationAfterLogin } from "./authentication";

describe("authentication use cases", () => {
  it("normalizes the login email before delegating to the gateway", async () => {
    const login = vi.fn().mockResolvedValue({ units: [] });

    await authenticate({ login }, { email: "  OWNER@CLINI.COM ", password: "secret" });

    expect(login).toHaveBeenCalledWith({ email: "owner@clini.com", password: "secret" });
  });

  it("asks for unit selection only when more than one unit is active", () => {
    const session = (statuses: Array<"ACTIVE" | "INACTIVE">) => ({
      units: statuses.map((status, index) => ({ id: String(index), name: "Unit", status, primary: index === 0, timezone: "UTC" })),
    }) as never;

    expect(destinationAfterLogin(session(["ACTIVE"]))).toBe("/");
    expect(destinationAfterLogin(session(["ACTIVE", "ACTIVE"]))).toBe("/select-unit");
    expect(destinationAfterLogin(session(["ACTIVE", "INACTIVE"]))).toBe("/");
  });
});
