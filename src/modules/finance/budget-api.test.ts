import { afterEach, describe, expect, it, vi } from "vitest";

import { listBudgets } from "./budget-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("budget API contract", () => {
  it("envia filtros e paginação para a listagem de orçamentos", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      page: 2,
      size: 30,
      totalItems: 61,
      totalPages: 3,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listBudgets({ status: "APPROVED", page: 2 })).resolves.toMatchObject({ page: 2, totalPages: 3 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/finance/budgets?status=APPROVED&page=2&size=30"),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
