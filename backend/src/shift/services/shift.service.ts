import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";

export const MAX_SHIFT_DURATION_MS = 8.5 * 60 * 60 * 1000;
export const EXTEND_WINDOW_START_MS = 8 * 60 * 60 * 1000;
export const EXTENSION_DURATION_MS = 2 * 60 * 60 * 1000;

type editRequestType = {
  id: string;
  proposedClockOut: Date;
  reason: string;
  status: string;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type shiftType = {
  id: string;
  userId: string;
  clockIn: Date;
  clockOut: Date | null;
  status: string;
  autoClosed: boolean;
  needsReview: boolean;
  extendedCutoffAt: Date | null;
  extensionNote: string | null;
  extendedAt: Date | null;
  breaks: { id: string; startTime: Date; endTime: Date | null }[];
  editRequests: editRequestType[];
};

const shiftInclude = {
  breaks: true,
  editRequests: { orderBy: { createdAt: "desc" as const } },
};

function sumBreakMs(
  breaks: { startTime: Date; endTime: Date | null }[],
  now: Date,
): number {
  return breaks.reduce((total, brk) => {
    const end = brk.endTime ?? now;
    return total + (end.getTime() - brk.startTime.getTime());
  }, 0);
}

function effectiveAutoCloseAt(shift: {
  clockIn: Date;
  extendedCutoffAt: Date | null;
}): Date {
  return (
    shift.extendedCutoffAt ??
    new Date(shift.clockIn.getTime() + MAX_SHIFT_DURATION_MS)
  );
}

function serializeShift(shift: shiftType, now: Date = new Date()) {
  const breakMs = sumBreakMs(shift.breaks, now);
  const shiftEnd = shift.clockOut ?? now;
  const totalMs = shiftEnd.getTime() - shift.clockIn.getTime();
  const workedMs = Math.max(totalMs - breakMs, 0);

  const activeBreak = shift.breaks.find((brk) => brk.endTime === null) ?? null;

  return {
    id: shift.id,
    userId: shift.userId,
    clockIn: shift.clockIn,
    clockOut: shift.clockOut,
    status: shift.status,
    autoClosed: shift.autoClosed,
    needsReview: shift.needsReview,

    autoCloseAt: effectiveAutoCloseAt(shift),
    extendWindowStartsAt: new Date(
      shift.clockIn.getTime() + EXTEND_WINDOW_START_MS,
    ),
    extendedCutoffAt: shift.extendedCutoffAt,
    extensionNote: shift.extensionNote,
    extendedAt: shift.extendedAt,
    breakDurationMs: breakMs,
    workedDurationMs: workedMs,
    activeBreak: activeBreak
      ? { id: activeBreak.id, startTime: activeBreak.startTime }
      : null,
    breaks: shift.breaks,
    editRequests: shift.editRequests,
  };
}

async function autoCloseIfExpired(shift: shiftType): Promise<boolean> {
  const cutoff = effectiveAutoCloseAt(shift);

  if (cutoff.getTime() > Date.now()) {
    return false;
  }

  await prisma.break.updateMany({
    where: { shiftId: shift.id, endTime: null },
    data: { endTime: cutoff },
  });

  await prisma.shift.update({
    where: { id: shift.id },
    data: {
      status: "COMPLETED",
      clockOut: cutoff,
      autoClosed: true,
      needsReview: true,
    },
  });

  return true;
}

async function findActiveShift(userId: string): Promise<shiftType | null> {
  const active: shiftType | null = await prisma.shift.findFirst({
    where: { userId, status: { in: ["WORKING", "ON_BREAK"] } },
    include: shiftInclude,
  });

  if (!active) {
    return null;
  }

  const wasAutoClosed = await autoCloseIfExpired(active);

  return wasAutoClosed ? null : active;
}

export async function getUnresolvedAutoClosedShifts(userId: string) {
  const shifts: shiftType[] = await prisma.shift.findMany({
    where: { userId, autoClosed: true, editRequests: { none: {} } },
    include: shiftInclude,
    orderBy: { clockIn: "asc" },
  });

  return shifts.map((shift) => serializeShift(shift));
}

export async function clockIn(userId: string) {
  const active = await findActiveShift(userId);

  if (active) {
    throw new AppError(
      "You already have an active shift. Clock out first.",
      409,
    );
  }

  const unresolved = await getUnresolvedAutoClosedShifts(userId);

  if (unresolved.length > 0) {
    throw new AppError(
      "You have an auto-closed shift that needs a correction note before you can clock in again.",
      409,
    );
  }

  const shift = await prisma.shift.create({
    data: { userId, status: "WORKING" },
    include: shiftInclude,
  });

  return serializeShift(shift);
}

export async function clockOut(userId: string) {
  const active = await findActiveShift(userId);

  if (!active) {
    throw new AppError(
      "You do not have an active shift to clock out from.",
      409,
    );
  }

  if (active.status === "ON_BREAK") {
    throw new AppError("End your break before clocking out.", 409);
  }

  const now = new Date();

  const shift = await prisma.shift.update({
    where: { id: active.id },
    data: { status: "COMPLETED", clockOut: now },
    include: shiftInclude,
  });

  return serializeShift(shift, now);
}

export async function getCurrentShift(userId: string) {
  const active = await findActiveShift(userId);

  if (!active) {
    return null;
  }

  return serializeShift(active);
}

export async function getCompletedShiftsForUser(userId: string) {
  const shifts: shiftType[] = await prisma.shift.findMany({
    where: { userId, status: "COMPLETED" },
    include: shiftInclude,
    orderBy: { clockIn: "desc" },
  });

  return shifts.map((shift) => serializeShift(shift));
}

export async function getShiftHistory(userId: string) {
  return getCompletedShiftsForUser(userId);
}

export async function getAllShiftsForUser(userId: string) {
  const shifts: shiftType[] = await prisma.shift.findMany({
    where: { userId },
    include: shiftInclude,
    orderBy: { clockIn: "desc" },
  });

  return shifts.map((shift) => serializeShift(shift));
}

export async function getActiveShiftOrThrow(userId: string) {
  const active = await findActiveShift(userId);

  if (!active) {
    throw new AppError("You need an active shift to do that.", 409);
  }

  return active;
}

export async function extendShift(userId: string, note: string) {
  const shift = await prisma.shift.findFirst({
    where: { userId, status: { in: ["WORKING", "ON_BREAK"] } },
  });

  if (!shift) {
    throw new AppError("You don't have an active shift to extend.", 409);
  }

  const currentCutoff = effectiveAutoCloseAt(shift);

  if (currentCutoff.getTime() <= Date.now()) {
    await prisma.break.updateMany({
      where: { shiftId: shift.id, endTime: null },
      data: { endTime: currentCutoff },
    });

    await prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: "COMPLETED",
        clockOut: currentCutoff,
        autoClosed: true,
        needsReview: true,
      },
    });

    throw new AppError(
      "This shift already reached its maximum duration and was closed automatically. Submit a correction request instead.",
      409,
    );
  }

  if (shift.extendedCutoffAt) {
    throw new AppError("This shift has already been extended once.", 409);
  }

  const extendWindowStartsAt = new Date(
    shift.clockIn.getTime() + EXTEND_WINDOW_START_MS,
  );

  if (Date.now() < extendWindowStartsAt.getTime()) {
    throw new AppError(
      "Extend isn't available yet — it opens once this shift has been active for 8 hours.",
      409,
    );
  }

  const updated = await prisma.shift.update({
    where: { id: shift.id },
    data: {
      extendedCutoffAt: new Date(
        shift.clockIn.getTime() + MAX_SHIFT_DURATION_MS + EXTENSION_DURATION_MS,
      ),
      extensionNote: note,
      extendedAt: new Date(),
    },
    include: shiftInclude,
  });

  return serializeShift(updated);
}

export async function createShiftEditRequest(
  userId: string,
  shiftId: string,
  proposedClockOut: Date,
  reason: string,
) {
  const shift = await prisma.shift.findUnique({ where: { id: shiftId } });

  if (!shift || shift.userId !== userId) {
    throw new AppError("Shift not found.", 404);
  }

  if (shift.status !== "COMPLETED") {
    throw new AppError(
      "This shift hasn't been clocked out yet — clock out first, then request a correction if the time is wrong.",
      409,
    );
  }

  if (proposedClockOut.getTime() <= shift.clockIn.getTime()) {
    throw new AppError(
      "Proposed clock-out must be after this shift's clock-in.",
      400,
    );
  }

  if (proposedClockOut.getTime() > Date.now()) {
    throw new AppError("Proposed clock-out can't be in the future.", 400);
  }

  const existingPending = await prisma.shiftEditRequest.findFirst({
    where: { shiftId, status: "PENDING" },
  });

  if (existingPending) {
    throw new AppError(
      "You already have a pending edit request for this shift.",
      409,
    );
  }

  await prisma.shiftEditRequest.create({
    data: { shiftId, requestedByUserId: userId, proposedClockOut, reason },
  });

  const updated = await prisma.shift.findUniqueOrThrow({
    where: { id: shiftId },
    include: shiftInclude,
  });

  return serializeShift(updated);
}
