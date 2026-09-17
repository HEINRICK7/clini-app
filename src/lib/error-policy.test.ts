import { describe, expect, it } from "vitest";

import { ApiError } from "./api/client";
import { apiErrorMessage, apiErrorProblem, isUnauthorized } from "./error-policy";

describe("error policy", () => {
  it("exposes authorization state without leaking the HTTP adapter to UI", () => {
    const error = new ApiError("Sessão expirada.", 401, { detail: "Sessão expirada." });

    expect(isUnauthorized(error)).toBe(true);
    expect(apiErrorMessage(error, "fallback")).toBe("Sessão expirada.");
    expect(apiErrorProblem(error)).toEqual({ detail: "Sessão expirada." });
  });

  it("uses a safe fallback for unknown failures", () => {
    expect(isUnauthorized(new Error("falha"))).toBe(false);
    expect(apiErrorMessage(new Error("falha"), "Tente novamente.")).toBe("Tente novamente.");
    expect(apiErrorProblem(new Error("falha"))).toBeNull();
  });
});
