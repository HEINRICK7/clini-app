import { afterEach, describe, expect, it, vi } from "vitest";

import { listFinancialEntries } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("finance API contract", () => {
  it("envia filtros e paginação para a listagem de lançamentos", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      page: 1,
      size: 30,
      totalItems: 31,
      totalPages: 2,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listFinancialEntries({ status: "OPEN", page: 1 })).resolves.toMatchObject({ page: 1, totalPages: 2 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/finance/entries?status=OPEN&page=1&size=30"),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
