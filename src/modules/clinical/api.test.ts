import { afterEach, describe, expect, it, vi } from "vitest";

import { listClinicalEvolutions } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("clinical record API contract", () => {
  it("envia paciente e paginação para a listagem de evoluções", async () => {
    const patientId = "11111111-1111-1111-1111-111111111113";
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      page: 1,
      size: 20,
      totalItems: 21,
      totalPages: 2,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listClinicalEvolutions(patientId, 1)).resolves.toMatchObject({ page: 1, totalPages: 2 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/clinical/evolutions?patientId=${patientId}&page=1&size=20`),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
