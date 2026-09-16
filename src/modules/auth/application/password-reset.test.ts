import { describe, expect, it } from "vitest";

import { canSubmitNewPassword, passwordsMatch } from "./password-reset";

describe("password reset use cases", () => {
  it("requires both a minimum length and equal confirmation", () => {
    expect(canSubmitNewPassword("short", "short")).toBe(false);
    expect(canSubmitNewPassword("long-enough", "different")).toBe(false);
    expect(canSubmitNewPassword("long-enough", "long-enough")).toBe(true);
  });

  it("reports the confirmation rule independently from presentation", () => {
    expect(passwordsMatch("new-password", "new-password")).toBe(true);
    expect(passwordsMatch("new-password", "other-password")).toBe(false);
  });
});
