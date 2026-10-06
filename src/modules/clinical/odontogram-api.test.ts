import { afterEach, describe, expect, it, vi } from "vitest";

import { addToTreatmentPlan } from "./odontogram-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("odontogram planning API", () => {
  it("sends the selected status when linking a treatment plan to a tooth", async () => {
    const patientId = "11111111-1111-4111-8111-111111111113";
    const unitId = "11111111-1111-4111-8111-111111111114";
    const appointmentId = "11111111-1111-4111-8111-111111111115";
    const planItemId = "11111111-1111-4111-8111-111111111116";
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: "csrf-test-token" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        id: "11111111-1111-4111-8111-111111111117",
        tenantId: "11111111-1111-4111-8111-111111111118",
        unitId,
        patientId,
        toothId: "16",
        appointmentId,
        type: "PLANNING",
        status: "IN_PROGRESS",
        description: "Planejamento em andamento",
        procedureId: null,
        planItemId,
        performedAt: "2026-10-06T20:00:00.000Z",
        createdBy: "11111111-1111-4111-8111-111111111119",
        createdAt: "2026-10-06T20:00:00.000Z",
      }]), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(addToTreatmentPlan(patientId, {
      unitId,
      appointmentId,
      toothIds: ["16"],
      planItemId,
      status: "IN_PROGRESS",
    })).resolves.toMatchObject([{ status: "IN_PROGRESS", planItemId }]);

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining(`/patients/${patientId}/tooth-planning`),
      expect.objectContaining({ body: expect.stringContaining('"status":"IN_PROGRESS"') }),
    );
  });
});
