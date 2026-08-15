import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import {
  BREAK_ALLOWANCE_MS,
  getActiveShiftOrThrow,
  getCurrentShift,
  sumBreakMs,
} from "../../shift/services/shift.service";

export async function startBreak(userId: string) {
  const shift = await getActiveShiftOrThrow(userId);

  if (shift.status === "ON_BREAK") {
    throw new AppError("You already have a break in progress.", 409);
  }

  const usedBreakMs = sumBreakMs(shift.breaks, new Date());

  if (usedBreakMs >= BREAK_ALLOWANCE_MS) {
    throw new AppError("You've used your full hour of break for this shift.", 409);
  }

  await prisma.$transaction([
    prisma.break.create({ data: { shiftId: shift.id, startTime: new Date() } }),
    prisma.shift.update({ where: { id: shift.id }, data: { status: "ON_BREAK" } }),
  ]);

  return getCurrentShift(userId);
}

export async function endBreak(userId: string) {
  const shift = await getActiveShiftOrThrow(userId);

  if (shift.status !== "ON_BREAK") {
    throw new AppError("You do not have an active break to end.", 409);
  }

  const activeBreak = shift.breaks.find((brk: { endTime: Date | null }) => brk.endTime === null);

  if (!activeBreak) {
    throw new AppError("You do not have an active break to end.", 409);
  }

  await prisma.$transaction([
    prisma.break.update({ where: { id: activeBreak.id }, data: { endTime: new Date() } }),
    prisma.shift.update({ where: { id: shift.id }, data: { status: "WORKING" } }),
  ]);

  return getCurrentShift(userId);
}
