import { afterEach, describe, expect, it, vi } from "vitest";

import {
  activateInvitation,
  activateInvitationInputSchema,
  getInvitationDetails,
  submitCommercialLead,
} from "./api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auth API contracts", () => {
  it("trims and validates the small public lead before sending it", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ token: "csrf-token" }))
      .mockResolvedValueOnce(jsonResponse({ id: "550e8400-e29b-41d4-a716-446655440000", status: "NEW" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    await expect(submitCommercialLead({
      name: "  Dra. Ana Lima  ",
      email: "  ana@clini.com  ",
      whatsapp: " (86) 99999-9999 ",
    })).resolves.toEqual({ id: "550e8400-e29b-41d4-a716-446655440000", status: "NEW" });

    const [, requestInit] = fetchMock.mock.calls[1] ?? [];
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      name: "Dra. Ana Lima",
      email: "ana@clini.com",
      whatsapp: "(86) 99999-9999",
    });
  });

  it("recovers invitation identity from the token path without a query string", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse({
      name: "Dra. Ana Lima",
      email: "ana@clini.com",
      status: "PENDING",
      expiresAt: "2026-09-18T12:00:00Z",
    }));
    vi.stubGlobal("fetch", fetchMock);
    const token = "safe-token?name=Ana&email=ana@clini.com";

    await expect(getInvitationDetails(token)).resolves.toMatchObject({
      name: "Dra. Ana Lima",
      email: "ana@clini.com",
    });

    const [requestUrl] = fetchMock.mock.calls[0] ?? [];
    expect(String(requestUrl)).toContain(`/auth/invitations/${encodeURIComponent(token)}`);
    expect(new URL(String(requestUrl), "http://localhost").search).toBe("");
  });

  it("sends only complementary activation data to the token endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ token: "csrf-token" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    const token = "invite-token";

    await activateInvitation(token, {
      password: "senha-segura",
      confirmPassword: "senha-segura",
      termsAccepted: true,
    });

    const [requestUrl, requestInit] = fetchMock.mock.calls[1] ?? [];
    expect(String(requestUrl)).toBe(`/api/v1/auth/invitations/${token}/activate`);
    expect(new URL(String(requestUrl), "http://localhost").search).toBe("");
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      password: "senha-segura",
      confirmPassword: "senha-segura",
      termsAccepted: true,
    });
  });

  it("rejects mismatched passwords and unaccepted terms at the boundary", () => {
    expect(activateInvitationInputSchema.safeParse({
      password: "senha-segura",
      confirmPassword: "senha-diferente",
      termsAccepted: true,
    }).success).toBe(false);
    expect(activateInvitationInputSchema.safeParse({
      password: "senha-segura",
      confirmPassword: "senha-segura",
      termsAccepted: false,
    }).success).toBe(false);
  });
});
