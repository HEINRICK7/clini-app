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
});
