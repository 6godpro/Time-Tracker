import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

type NotificationRecord = {
  id: string;
  type: string;
  message: string;
  shiftEditRequestId: string | null;
  payrollPaymentId: string | null;
  read: boolean;
  createdAt: Date;
};

type NotificationType =
  | "SHIFT_EDIT_REQUEST_SUBMITTED"
  | "SHIFT_EDIT_REQUEST_APPROVED"
  | "SHIFT_EDIT_REQUEST_REJECTED"
  | "PAYROLL_PAYMENT_RECORDED"
  | "HOURLY_RATE_CHANGED";

function serializeNotification(notification: NotificationRecord) {
  return {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    shiftEditRequestId: notification.shiftEditRequestId,
    payrollPaymentId: notification.payrollPaymentId,
    read: notification.read,
    createdAt: notification.createdAt,
  };
}

async function createNotification(data: {
  userId: string;
  type: NotificationType;
  message: string;
  shiftEditRequestId?: string;
  payrollPaymentId?: string;
}) {
  await prisma.notification.create({ data });
}

export async function createShiftEditRequestDecisionNotification(
  userId: string,
  decision: "APPROVED" | "REJECTED",
  shiftClockIn: Date,
  shiftEditRequestId: string,
) {
  const date = shiftClockIn.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  await createNotification({
    userId,
    type:
      decision === "APPROVED"
        ? "SHIFT_EDIT_REQUEST_APPROVED"
        : "SHIFT_EDIT_REQUEST_REJECTED",
    message:
      decision === "APPROVED"
        ? `Your shift correction request for ${date} was approved.`
        : `Your shift correction request for ${date} was rejected.`,
    shiftEditRequestId,
  });
}

export async function createPayrollPaymentNotification(
  userId: string,
  payment: {
    id: string;
    periodFrom: Date;
    periodTo: Date;
    grossPayCents: number;
  },
) {
  const from = payment.periodFrom.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const to = payment.periodTo.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const amount = (payment.grossPayCents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  await createNotification({
    userId,
    type: "PAYROLL_PAYMENT_RECORDED",
    message: `You were paid ${amount} for ${from} – ${to}.`,
    payrollPaymentId: payment.id,
  });
}

export async function createShiftEditRequestSubmittedNotification(
  requesterName: string,
  shiftClockIn: Date,
  shiftEditRequestId: string,
) {
  const date = shiftClockIn.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const admins: { id: string }[] = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "SHIFT_EDIT_REQUEST_SUBMITTED",
        message: `${requesterName} requested a shift correction for ${date}.`,
        shiftEditRequestId,
      }),
    ),
  );
}

export async function createHourlyRateChangeNotification(
  userId: string,
  oldRateCents: number,
  newRateCents: number,
) {
  const oldRate = (oldRateCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  const newRate = (newRateCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

  await createNotification({
    userId,
    type: "HOURLY_RATE_CHANGED",
    message: `Your hourly rate was updated from ${oldRate}/hr to ${newRate}/hr.`,
  });
}

export async function listNotifications(userId: string) {
  const notifications: NotificationRecord[] =
    await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

  return notifications.map(serializeNotification);
}

export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.userId !== userId) {
    throw new AppError("Notification not found.", 404);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  return serializeNotification(updated);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
