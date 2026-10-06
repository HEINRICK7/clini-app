import { afterEach, describe, expect, it, vi } from "vitest";

import { listCatalogProcedures } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("catalog API contract", () => {
  it("asks for only procedures configured in the selected unit when requested", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      page: 0,
      size: 50,
      totalItems: 0,
      totalPages: 0,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listCatalogProcedures({ unitId: "unit-1", configuredOnly: true })).resolves.toMatchObject({ totalItems: 0 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/catalog/procedures?page=0&size=50&unitId=unit-1&configuredOnly=true&status=ACTIVE"),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
