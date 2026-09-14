import { describe, expect, it, vi } from "vitest";

import { getQualifiedSignatureProviderStatus } from "./signature-api";

describe("qualified signature API contract", () => {
  it("accepts the provider status without exposing provider credentials", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      signatureType: "QUALIFIED_ICP_BRASIL",
      providerKey: "unconfigured",
      configured: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getQualifiedSignatureProviderStatus()).resolves.toEqual({
      signatureType: "QUALIFIED_ICP_BRASIL",
      providerKey: "unconfigured",
      configured: false,
    });
  });

  it("rejects an unknown signature type instead of silently accepting a contract drift", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      signatureType: "UNKNOWN",
      providerKey: "unconfigured",
      configured: false,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getQualifiedSignatureProviderStatus()).rejects.toThrow();
  });
});
