import { afterEach, describe, expect, it, vi } from "vitest";

import { listNotifications } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("notifications API contract", () => {
  it("lista notificações com filtro de não lidas e paginação", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      items: [],
      page: 1,
      size: 20,
      totalItems: 21,
      totalPages: 2,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listNotifications({ unreadOnly: true, page: 1 })).resolves.toMatchObject({ page: 1, totalPages: 2 });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/notifications?unreadOnly=true&page=1&size=20"),
      expect.objectContaining({ credentials: "include" }),
    );
  });
});
