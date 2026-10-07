import { afterEach, describe, expect, it, vi } from "vitest";

import { listPatients } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("patient API contract", () => {
  it("envia página, tamanho e busca para a listagem paginada", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      page: 2,
      size: 20,
      totalItems: 41,
      totalPages: 3,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listPatients("Ana Maria", 2)).resolves.toMatchObject({ page: 2, totalPages: 3 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/patients?page=2&size=20&q=Ana+Maria"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("envia consultório e situação ao buscar pacientes para um campo relacionado", async () => {
    const unitId = "11111111-1111-4111-8111-111111111111";
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listPatients("Ana Maria", 0, 20, { unitId, status: "ACTIVE" })).resolves.toMatchObject({ totalItems: 0 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/patients?page=0&size=20&q=Ana+Maria&unitId=${unitId}&status=ACTIVE`),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
