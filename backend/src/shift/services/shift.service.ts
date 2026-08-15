import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { fullName } from "../../utils/name";
import { createShiftEditRequestSubmittedNotification } from "../../notification/services/notification.service";

export const BREAK_ALLOWANCE_MS = 60 * 60 * 1000;

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
  jobId: string;

  minimumWorkMinutesAtClockIn: number;
  breaks: { id: string; startTime: Date; endTime: Date | null }[];
  editRequests: editRequestType[];
};

const shiftInclude = {
  breaks: true,
  editRequests: { orderBy: { createdAt: "desc" as const } },
};

export function sumBreakMs(
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
  minimumWorkMinutesAtClockIn: number;
}): Date {
  return new Date(
    shift.clockIn.getTime() + shift.minimumWorkMinutesAtClockIn * 60_000,
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
    jobId: shift.jobId,
    minimumWorkMinutesAtClockIn: shift.minimumWorkMinutesAtClockIn,

    autoCloseAt: effectiveAutoCloseAt(shift),
    breakDurationMs: breakMs,

    breakAllowanceMs: BREAK_ALLOWANCE_MS,
    breakRemainingMs: Math.max(BREAK_ALLOWANCE_MS - breakMs, 0),
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

  await prisma.$transaction([
    prisma.break.updateMany({
      where: { shiftId: shift.id, endTime: null },
      data: { endTime: cutoff },
    }),
    prisma.shift.update({
      where: { id: shift.id },
      data: {
        status: "COMPLETED",
        clockOut: cutoff,
        autoClosed: true,
        needsReview: true,
      },
    }),
  ]);

  return true;
}

async function autoEndBreakIfExpired(
  shift: shiftType,
  now: Date = new Date(),
): Promise<boolean> {
  if (shift.status !== "ON_BREAK") {
    return false;
  }

  const activeBreak = shift.breaks.find((brk) => brk.endTime === null);

  if (!activeBreak) {
    return false;
  }

  const priorBreakMs = sumBreakMs(
    shift.breaks.filter((brk) => brk.id !== activeBreak.id),
    now,
  );
  const remainingAllowanceMs = Math.max(BREAK_ALLOWANCE_MS - priorBreakMs, 0);
  const cutoff = new Date(
    activeBreak.startTime.getTime() + remainingAllowanceMs,
  );

  if (cutoff.getTime() > now.getTime()) {
    return false;
  }

  await prisma.$transaction([
    prisma.break.update({
      where: { id: activeBreak.id },
      data: { endTime: cutoff },
    }),
    prisma.shift.update({
      where: { id: shift.id },
      data: { status: "WORKING" },
    }),
  ]);

  shift.status = "WORKING";
  activeBreak.endTime = cutoff;

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

  if (wasAutoClosed) {
    return null;
  }

  await autoEndBreakIfExpired(active);

  return active;
}

export async function getUnresolvedAutoClosedShifts(userId: string) {
  await findActiveShift(userId);

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

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      currentJobId: true,
      currentJob: { select: { minimumWorkMinutes: true } },
    },
  });

  const shift = await prisma.shift.create({
    data: {
      userId,
      status: "WORKING",
      clockIn: new Date(),
      jobId: user.currentJobId,
      minimumWorkMinutesAtClockIn: user.currentJob.minimumWorkMinutes,
    },
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

export async function getCompletedShiftsForUserInRange(
  userId: string,
  from: Date,
  to: Date,
) {
  const shifts: shiftType[] = await prisma.shift.findMany({
    where: { userId, status: "COMPLETED", clockIn: { gte: from, lte: to } },
    include: shiftInclude,
    orderBy: { clockIn: "desc" },
  });

  return shifts.map((shift) => serializeShift(shift));
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

  const requester = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });

  const created = await prisma.shiftEditRequest.create({
    data: { shiftId, requestedByUserId: userId, proposedClockOut, reason },
  });

  await createShiftEditRequestSubmittedNotification(
    fullName(requester),
    shift.clockIn,
    created.id,
  );

  const updated = await prisma.shift.findUniqueOrThrow({
    where: { id: shiftId },
    include: shiftInclude,
  });

  return serializeShift(updated);
}
