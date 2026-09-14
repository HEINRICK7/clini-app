import { z } from "zod";

import { apiRequest } from "@/lib/api/client";

const notificationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  recipientUserId: z.string().uuid(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  resourceType: z.string().nullable(),
  resourceId: z.string().uuid().nullable(),
  unread: z.boolean(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

const pageSchema = z.object({
  items: z.array(notificationSchema),
  page: z.number(),
  size: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

export type Notification = z.infer<typeof notificationSchema>;

export async function listNotifications(input: { unreadOnly?: boolean; page?: number; size?: number } = {}) {
  const params = new URLSearchParams({
    unreadOnly: String(input.unreadOnly ?? false),
    page: String(input.page ?? 0),
    size: String(input.size ?? 20),
  });
  return pageSchema.parse(await apiRequest<unknown>(`/notifications?${params.toString()}`));
}

export async function markNotificationRead(notificationId: string) {
  return notificationSchema.parse(await apiRequest<unknown>(`/notifications/${notificationId}/read`, { method: "POST" }));
}
