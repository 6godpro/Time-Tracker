import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { getCompletedShiftsForUserInRange } from "../../shift/services/shift.service";
import { computeWeeklyBreakdowns, resolveBreakIsPaid, sumWeeklyBreakdowns } from "./payrollCalculations";

// How close a client-reported component has to be to our own
// system-computed figure to be considered "the same," per the "a minute
// difference" example given when this feature was designed. Applied
// independently to each of the three components (regular/break/overtime).
export const RECONCILIATION_TOLERANCE_MS = 60_000; // 1 minute

type ReconciliationRow = {
  id: string;
  employeeId: string;
  periodFrom: Date;
  periodTo: Date;
  systemRegularDurationMs: number;
  systemBreakDurationMs: number;
  systemOvertimeDurationMs: number;
  clientRegularDurationMs: number | null;
  clientBreakDurationMs: number | null;
  clientOvertimeDurationMs: number | null;
  status: string;
  resolvedRegularDurationMs: number | null;
  resolvedBreakDurationMs: number | null;
  resolvedOvertimeDurationMs: number | null;
  resolutionReason: string | null;
  resolvedByUserId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function serializeReconciliation(row: ReconciliationRow) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    periodFrom: row.periodFrom,
    periodTo: row.periodTo,
    system: {
      regularDurationMs: row.systemRegularDurationMs,
      breakDurationMs: row.systemBreakDurationMs,
      overtimeDurationMs: row.systemOvertimeDurationMs,
    },
    client:
      row.clientRegularDurationMs === null
        ? null
        : {
            regularDurationMs: row.clientRegularDurationMs,
            breakDurationMs: row.clientBreakDurationMs as number,
            overtimeDurationMs: row.clientOvertimeDurationMs as number,
          },
    resolved:
      row.resolvedRegularDurationMs === null
        ? null
        : {
            regularDurationMs: row.resolvedRegularDurationMs,
            breakDurationMs: row.resolvedBreakDurationMs as number,
            overtimeDurationMs: row.resolvedOvertimeDurationMs as number,
          },
    status: row.status,
    resolutionReason: row.resolutionReason,
    resolvedByUserId: row.resolvedByUserId,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function computeSystemFigures(employeeId: string, from: Date, to: Date) {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    include: { currentJob: true },
  });

  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }

  const shifts = await getCompletedShiftsForUserInRange(employeeId, from, to);

  const breakdowns = computeWeeklyBreakdowns(
    shifts.map((shift) => ({
      clockIn: new Date(shift.clockIn),
      workedDurationMs: shift.workedDurationMs,
      breakDurationMs: shift.breakDurationMs,
      minimumWorkMinutesAtClockIn: shift.minimumWorkMinutesAtClockIn,
    })),
  );
  const totals = sumWeeklyBreakdowns(breakdowns);

  const breakIsPaid = resolveBreakIsPaid(employee, employee.currentJob);

  return {
    systemRegularDurationMs: totals.regularMs,
    systemBreakDurationMs: breakIsPaid ? totals.breakMs : 0,
    systemOvertimeDurationMs: totals.overtimeMs,
  };
}

// Creates the reconciliation row for a period the first time it's
// requested, computing our own system figures from shift data. If one
// already exists and has moved past PENDING (client figures already
// submitted, or already resolved), returns it as-is rather than
// recomputing — admin work already done for this period shouldn't be
// silently overwritten by a second "start reconciliation" click.
export async function createOrGetReconciliation(employeeId: string, from: Date, to: Date) {
  const existing = await prisma.payrollReconciliation.findUnique({
    where: { employeeId_periodFrom_periodTo: { employeeId, periodFrom: from, periodTo: to } },
  });

  if (existing) {
    return serializeReconciliation(existing);
  }

  const systemFigures = await computeSystemFigures(employeeId, from, to);

  const reconciliation = await prisma.payrollReconciliation.create({
    data: { employeeId, periodFrom: from, periodTo: to, ...systemFigures },
  });

  return serializeReconciliation(reconciliation);
}

export async function getReconciliation(employeeId: string, from: Date, to: Date) {
  const reconciliation = await prisma.payrollReconciliation.findUnique({
    where: { employeeId_periodFrom_periodTo: { employeeId, periodFrom: from, periodTo: to } },
  });

  return reconciliation ? serializeReconciliation(reconciliation) : null;
}

async function getReconciliationOrThrow(reconciliationId: string) {
  const reconciliation = await prisma.payrollReconciliation.findUnique({ where: { id: reconciliationId } });

  if (!reconciliation) {
    throw new AppError("Reconciliation not found.", 404);
  }

  return reconciliation;
}

// The admin's entry of the client's own record for the period. If every
// component is within RECONCILIATION_TOLERANCE_MS of our system figure,
// this settles the reconciliation immediately (status CLEAN, resolved*
// figures copied straight from the system figures) — no manual review
// needed for a negligible discrepancy. Otherwise it's FLAGGED and
// blocked on resolveReconciliation below.
export async function submitClientFigures(
  reconciliationId: string,
  clientFigures: { regularDurationMs: number; breakDurationMs: number; overtimeDurationMs: number },
) {
  const reconciliation = await getReconciliationOrThrow(reconciliationId);

  if (reconciliation.status === "RESOLVED") {
    throw new AppError("This reconciliation has already been resolved.", 409);
  }

  const withinTolerance =
    Math.abs(reconciliation.systemRegularDurationMs - clientFigures.regularDurationMs) <=
      RECONCILIATION_TOLERANCE_MS &&
    Math.abs(reconciliation.systemBreakDurationMs - clientFigures.breakDurationMs) <=
      RECONCILIATION_TOLERANCE_MS &&
    Math.abs(reconciliation.systemOvertimeDurationMs - clientFigures.overtimeDurationMs) <=
      RECONCILIATION_TOLERANCE_MS;

  const updated = await prisma.payrollReconciliation.update({
    where: { id: reconciliationId },
    data: {
      clientRegularDurationMs: clientFigures.regularDurationMs,
      clientBreakDurationMs: clientFigures.breakDurationMs,
      clientOvertimeDurationMs: clientFigures.overtimeDurationMs,
      status: withinTolerance ? "CLEAN" : "FLAGGED",
      ...(withinTolerance
        ? {
            resolvedRegularDurationMs: reconciliation.systemRegularDurationMs,
            resolvedBreakDurationMs: reconciliation.systemBreakDurationMs,
            resolvedOvertimeDurationMs: reconciliation.systemOvertimeDurationMs,
          }
        : {}),
    },
  });

  return serializeReconciliation(updated);
}

// An admin's documented decision on a FLAGGED reconciliation — the
// figures recorded here (not the raw system or client figures) are what
// payroll actually gets paid from, per resolveReconciliation-gated
// recordPayrollPayment in admin.service.ts.
export async function resolveReconciliation(
  reconciliationId: string,
  adminId: string,
  input: {
    regularDurationMs: number;
    breakDurationMs: number;
    overtimeDurationMs: number;
    reason: string;
  },
) {
  const reconciliation = await getReconciliationOrThrow(reconciliationId);

  if (reconciliation.status !== "FLAGGED") {
    throw new AppError("Only a flagged reconciliation can be resolved.", 409);
  }

  const updated = await prisma.payrollReconciliation.update({
    where: { id: reconciliationId },
    data: {
      status: "RESOLVED",
      resolvedRegularDurationMs: input.regularDurationMs,
      resolvedBreakDurationMs: input.breakDurationMs,
      resolvedOvertimeDurationMs: input.overtimeDurationMs,
      resolutionReason: input.reason,
      resolvedByUserId: adminId,
      resolvedAt: new Date(),
    },
  });

  return serializeReconciliation(updated);
}
