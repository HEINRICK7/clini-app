import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiDownload, apiRequest } from "./client";

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("sends authenticated safe requests with a request id and no CSRF round trip", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest<{ ok: boolean }>("/auth/me")).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.credentials).toBe("include");
    expect(init?.headers).toMatchObject({ Accept: "application/json" });
    expect((init?.headers as Record<string, string>)["X-Request-Id"]).toEqual(expect.any(String));
    expect((init?.headers as Record<string, string>)["X-CSRF-TOKEN"]).toBeUndefined();
  });

  it("gets CSRF before mutating and preserves Problem Details as ApiError", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ token: "csrf-token" }))
      .mockResolvedValueOnce(jsonResponse({ title: "Conflito", status: 409, detail: "Paciente já existe." }, 409));
    vi.stubGlobal("fetch", fetchMock);

    const promise = apiRequest("/patients", { method: "POST", body: JSON.stringify({ fullName: "Paciente" }) });
    await expect(promise).rejects.toBeInstanceOf(ApiError);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, csrfInit] = fetchMock.mock.calls[0] ?? [];
    expect(csrfInit?.credentials).toBe("include");
    const [, requestInit] = fetchMock.mock.calls[1] ?? [];
    expect(requestInit?.headers).toMatchObject({
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": "csrf-token",
    });

    try {
      await promise;
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ status: 409, message: "Paciente já existe." });
    }
  });

  it("does not force JSON content type for multipart downloads or uploads", async () => {
    const blob = new Blob(["arquivo"], { type: "application/pdf" });
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ token: "csrf-token" }))
      .mockResolvedValueOnce(jsonResponse({ id: "attachment-id" }))
      .mockResolvedValueOnce(new Response(blob, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const form = new FormData();
    form.append("file", blob, "arquivo.pdf");
    await apiRequest("/clinical/attachments", { method: "POST", body: form });
    await apiDownload("/clinical/attachments/id/download");

    const [, uploadInit] = fetchMock.mock.calls[1] ?? [];
    expect((uploadInit?.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
    const [, downloadInit] = fetchMock.mock.calls[2] ?? [];
    expect(downloadInit?.credentials).toBe("include");
  });
});
