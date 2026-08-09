import { Request, Response } from "express";
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service";

export async function listNotificationsHandler(req: Request, res: Response) {
  const notifications = await listNotifications(req.userId as string);
  res.status(200).json({ notifications });
}

export async function unreadNotificationCountHandler(req: Request, res: Response) {
  const count = await getUnreadNotificationCount(req.userId as string);
  res.status(200).json({ count });
}

export async function markNotificationReadHandler(req: Request, res: Response) {
  const notification = await markNotificationRead(req.userId as string, req.params.notificationId);
  res.status(200).json({ notification });
}

export async function markAllNotificationsReadHandler(req: Request, res: Response) {
  await markAllNotificationsRead(req.userId as string);
  res.status(200).json({ success: true });
}
