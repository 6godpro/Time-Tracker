import { apiClient } from "./client";
import type { Notification } from "@/types/notification";

export async function listNotificationsRequest(): Promise<Notification[]> {
  const { data } = await apiClient.get<{ notifications: Notification[] }>("/notification");
  return data.notifications;
}

export async function unreadNotificationCountRequest(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>("/notification/unread-count");
  return data.count;
}

export async function markNotificationReadRequest(notificationId: string): Promise<Notification> {
  const { data } = await apiClient.patch<{ notification: Notification }>(
    `/notification/${notificationId}/read`,
  );
  return data.notification;
}

export async function markAllNotificationsReadRequest(): Promise<void> {
  await apiClient.patch("/notification/read-all");
}
