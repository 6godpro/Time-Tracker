import ExcelJS from "exceljs";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { fullName } from "../../utils/name";
import {
  getAllShiftsForUser,
  getCompletedShiftsForUser,
  getCompletedShiftsForUserInRange,
} from "../../shift/services/shift.service";
import {
  computeWeeklyBreakdowns,
  resolveBreakIsPaid,
  sumWeeklyBreakdowns,
} from "../../reconciliation/services/payrollCalculations";
import { getReconciliation } from "../../reconciliation/services/reconciliation.service";
import {
  createHourlyRateChangeNotification,
  createPayrollPaymentNotification,
  createShiftEditRequestDecisionNotification,
} from "../../notification/services/notification.service";

const editRequestInclude = {
  requestedBy: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  shift: {
    select: {
      id: true,
      clockIn: true,
      clockOut: true,
      autoClosed: true,
      needsReview: true,
    },
  },
};

function serializeEditRequest(request: {
  id: string;
  status: string;
  reason: string;
  proposedClockOut: Date;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  requestedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  shift: {
    id: string;
    clockIn: Date;
    clockOut: Date | null;
    autoClosed: boolean;
    needsReview: boolean;
  };
}) {
  return {
    id: request.id,
    status: request.status,
    reason: request.reason,
    proposedClockOut: request.proposedClockOut,
    reviewNote: request.reviewNote,
    reviewedAt: request.reviewedAt,
    createdAt: request.createdAt,
    requestedBy: {
      id: request.requestedBy.id,
      fullName: fullName(request.requestedBy),
      email: request.requestedBy.email,
    },
    shift: request.shift,
  };
}

export async function listEmployees() {
  const users = await prisma.user.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true,
      hourlyRateCents: true,
      currentJobId: true,
      currentJob: {
        select: {
          id: true,
          name: true,
          minimumWorkMinutes: true,
          breakIsPaidByDefault: true,
        },
      },
      breakIsPaidOverride: true,
      clientId: true,
      client: { select: { id: true, name: true } },
      _count: { select: { shifts: true } },
      shifts: {
        where: { status: { in: ["WORKING", "ON_BREAK"] } },
        select: { status: true },
        take: 1,
      },
    },
  });

  type ListedUser = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    createdAt: Date;
    hourlyRateCents: number;
    currentJob: {
      id: string;
      name: string;
      minimumWorkMinutes: number;
      breakIsPaidByDefault: boolean;
    };
    breakIsPaidOverride: boolean | null;
    client: { id: string; name: string } | null;
    _count: { shifts: number };
    shifts: { status: string }[];
  };

  return (users as ListedUser[]).map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: fullName(user),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    hourlyRateCents: user.hourlyRateCents,
    job: {
      id: user.currentJob.id,
      name: user.currentJob.name,
      minimumWorkMinutes: user.currentJob.minimumWorkMinutes,
    },
    breakIsPaidOverride: user.breakIsPaidOverride,
    breakIsPaid: resolveBreakIsPaid(user, user.currentJob),
    client: user.client ? { id: user.client.id, name: user.client.name } : null,
    totalShifts: user._count.shifts,
    currentStatus: user.shifts[0]?.status ?? "NOT_WORKING",
  }));
}

async function getEmployeeOrThrow(employeeId: string) {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      hourlyRateCents: true,
      currentJobId: true,
      currentJob: {
        select: {
          id: true,
          name: true,
          minimumWorkMinutes: true,
          breakIsPaidByDefault: true,
        },
      },
      breakIsPaidOverride: true,
      clientId: true,
      client: { select: { id: true, name: true } },
    },
  });

  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }

  return { ...employee, fullName: fullName(employee) };
}

export async function updateEmployeeRate(
  employeeId: string,
  hourlyRateCents: number,
) {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { id: true, hourlyRateCents: true },
  });

  if (!employee) {
    throw new AppError("Employee not found.", 404);
  }

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: { hourlyRateCents },
    select: { id: true, hourlyRateCents: true },
  });

  if (employee.hourlyRateCents !== hourlyRateCents) {
    await createHourlyRateChangeNotification(
      employeeId,
      employee.hourlyRateCents,
      hourlyRateCents,
    );
  }

  return updated;
}

export async function updateEmployeeJob(employeeId: string, jobId: string) {
  await getEmployeeOrThrow(employeeId);

  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    throw new AppError("Job not found.", 404);
  }

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: { currentJobId: jobId },
    select: {
      id: true,
      currentJobId: true,
      currentJob: { select: { id: true, name: true } },
    },
  });

  return updated;
}

export async function updateEmployeeBreakOverride(
  employeeId: string,
  breakIsPaidOverride: boolean | null,
) {
  await getEmployeeOrThrow(employeeId);

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: { breakIsPaidOverride },
    select: { id: true, breakIsPaidOverride: true },
  });

  return updated;
}

export async function updateEmployeeClient(
  employeeId: string,
  clientId: string | null,
) {
  await getEmployeeOrThrow(employeeId);

  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new AppError("Client not found.", 404);
    }
  }

  const updated = await prisma.user.update({
    where: { id: employeeId },
    data: { clientId },
    select: {
      id: true,
      clientId: true,
      client: { select: { id: true, name: true } },
    },
  });

  return updated;
}

function serializeClient(client: {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return client;
}

export async function listClients() {
  const clients = await prisma.client.findMany({ orderBy: { name: "asc" } });
  return clients.map(serializeClient);
}

export async function createClient(name: string) {
  const existing = await prisma.client.findUnique({ where: { name } });
  if (existing) {
    throw new AppError("A client with this name already exists.", 409);
  }

  const client = await prisma.client.create({ data: { name } });
  return serializeClient(client);
}

export async function setClientActive(clientId: string, isActive: boolean) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data: { isActive },
  });
  return serializeClient(updated);
}

export async function getEmployeeShifts(employeeId: string) {
  const employee = await getEmployeeOrThrow(employeeId);
  const shifts = await getAllShiftsForUser(employeeId);

  return { employee, shifts };
}

function msToHours(ms: number): number {
  return Math.round((ms / 3_600_000) * 100) / 100;
}

export async function buildEmployeeShiftsWorkbook(employeeId: string): Promise<{
  employee: { fullName: string; email: string };
  buffer: ExcelJS.Buffer;
}> {
  const employee = await getEmployeeOrThrow(employeeId);
  const shifts = await getCompletedShiftsForUser(employeeId);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TimeTracker";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Shifts", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Clock In", key: "clockIn", width: 12 },
    { header: "Clock Out", key: "clockOut", width: 12 },
    { header: "Break Duration (hrs)", key: "breakHours", width: 20 },
    { header: "Worked Duration (hrs)", key: "workedHours", width: 22 },
  ];

  sheet.getRow(1).font = {
    name: "Arial",
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  sheet.getRow(1).alignment = { vertical: "middle" };

  for (const shift of shifts) {
    sheet.addRow({
      date: new Date(shift.clockIn).toLocaleDateString(),
      clockIn: new Date(shift.clockIn).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clockOut: shift.clockOut
        ? new Date(shift.clockOut).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      breakHours: msToHours(shift.breakDurationMs),
      workedHours: msToHours(shift.workedDurationMs),
    });
  }

  sheet.eachRow((row) => {
    row.font = { ...(row.font ?? {}), name: row.font?.name ?? "Arial" };
  });

  if (shifts.length === 0) {
    sheet.addRow({ date: "No completed shifts yet" });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return { employee, buffer };
}

function grossPayCentsFor(totalMs: number, hourlyRateCents: number): number {
  return Math.round((totalMs / 3_600_000) * hourlyRateCents);
}

async function computeSystemBreakdown(
  employee: {
    id: string;
    breakIsPaidOverride: boolean | null;
    currentJob: { breakIsPaidByDefault: boolean };
  },
  from: Date,
  to: Date,
) {
  const shifts = await getCompletedShiftsForUserInRange(employee.id, from, to);
  const unresolvedShiftCount = shifts.filter(
    (shift) => shift.needsReview,
  ).length;

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
    shiftCount: shifts.length,
    unresolvedShiftCount,
    regularDurationMs: totals.regularMs,
    overtimeDurationMs: totals.overtimeMs,
    compensatedBreakDurationMs: breakIsPaid ? totals.breakMs : 0,
  };
}

export async function getEmployeePayroll(
  employeeId: string,
  from: Date,
  to: Date,
) {
  const employee = await getEmployeeOrThrow(employeeId);
  const breakdown = await computeSystemBreakdown(employee, from, to);
  const reconciliation = await getReconciliation(employeeId, from, to);

  const totalMs =
    breakdown.regularDurationMs +
    breakdown.overtimeDurationMs +
    breakdown.compensatedBreakDurationMs;

  return {
    employee: {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      hourlyRateCents: employee.hourlyRateCents,
    },
    from,
    to,
    shiftCount: breakdown.shiftCount,

    unresolvedShiftCount: breakdown.unresolvedShiftCount,
    system: {
      regularDurationMs: breakdown.regularDurationMs,
      overtimeDurationMs: breakdown.overtimeDurationMs,
      compensatedBreakDurationMs: breakdown.compensatedBreakDurationMs,
    },

    estimatedGrossPayCents: grossPayCentsFor(totalMs, employee.hourlyRateCents),
    reconciliation,
  };
}

type PayrollEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hourlyRateCents: number;
  breakIsPaidOverride: boolean | null;
  currentJob: { breakIsPaidByDefault: boolean };
};

export async function getPayrollForAllEmployees(from: Date, to: Date) {
  const employees: PayrollEmployee[] = await prisma.user.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      hourlyRateCents: true,
      breakIsPaidOverride: true,
      currentJob: { select: { breakIsPaidByDefault: true } },
    },
  });

  const rows = await Promise.all(
    employees.map(async (employee: PayrollEmployee) => {
      const breakdown = await computeSystemBreakdown(employee, from, to);
      const totalMs =
        breakdown.regularDurationMs +
        breakdown.overtimeDurationMs +
        breakdown.compensatedBreakDurationMs;

      return {
        employee: {
          id: employee.id,
          fullName: fullName(employee),
          email: employee.email,
          hourlyRateCents: employee.hourlyRateCents,
        },
        shiftCount: breakdown.shiftCount,
        system: {
          regularDurationMs: breakdown.regularDurationMs,
          overtimeDurationMs: breakdown.overtimeDurationMs,
          compensatedBreakDurationMs: breakdown.compensatedBreakDurationMs,
        },
        estimatedGrossPayCents: grossPayCentsFor(
          totalMs,
          employee.hourlyRateCents,
        ),
      };
    }),
  );

  return {
    from,
    to,
    rows,
    totalEstimatedGrossPayCents: rows.reduce(
      (total, row) => total + row.estimatedGrossPayCents,
      0,
    ),
  };
}

type PayrollPaymentRow = {
  id: string;
  periodFrom: Date;
  periodTo: Date;
  hourlyRateCents: number;
  regularDurationMs: number;
  overtimeDurationMs: number;
  compensatedBreakDurationMs: number;
  workedDurationMs: number;
  grossPayCents: number;
  reconciliationId: string | null;
  paidAt: Date;
  createdAt: Date;
};

function serializePayrollPayment(payment: PayrollPaymentRow) {
  return {
    id: payment.id,
    periodFrom: payment.periodFrom,
    periodTo: payment.periodTo,
    hourlyRateCents: payment.hourlyRateCents,
    regularDurationMs: payment.regularDurationMs,
    overtimeDurationMs: payment.overtimeDurationMs,
    compensatedBreakDurationMs: payment.compensatedBreakDurationMs,
    workedDurationMs: payment.workedDurationMs,
    grossPayCents: payment.grossPayCents,
    reconciliationId: payment.reconciliationId,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  };
}

export async function recordPayrollPayment(
  employeeId: string,
  from: Date,
  to: Date,
) {
  const payroll = await getEmployeePayroll(employeeId, from, to);

  if (payroll.unresolvedShiftCount > 0) {
    throw new AppError(
      `This period includes ${payroll.unresolvedShiftCount} shift${payroll.unresolvedShiftCount === 1 ? "" : "s"} still awaiting a correction request review. Resolve ${payroll.unresolvedShiftCount === 1 ? "it" : "them"} before recording this payment.`,
      409,
    );
  }

  if (!payroll.reconciliation || !payroll.reconciliation.resolved) {
    throw new AppError(
      "This period hasn't been reconciled against the client's record yet. Start a reconciliation and resolve any discrepancies before recording payment.",
      409,
    );
  }

  const duplicate = await prisma.payrollPayment.findFirst({
    where: { userId: employeeId, periodFrom: from, periodTo: to },
  });

  if (duplicate) {
    throw new AppError(
      "A payment for this exact period has already been recorded.",
      409,
    );
  }

  const alreadyPaid = await prisma.payrollPayment.findUnique({
    where: { reconciliationId: payroll.reconciliation.id },
  });

  if (alreadyPaid) {
    throw new AppError("This reconciliation has already been paid out.", 409);
  }

  const { regularDurationMs, overtimeDurationMs, breakDurationMs } =
    payroll.reconciliation.resolved;
  const totalMs = regularDurationMs + overtimeDurationMs + breakDurationMs;

  const payment = await prisma.payrollPayment.create({
    data: {
      userId: employeeId,
      periodFrom: from,
      periodTo: to,
      hourlyRateCents: payroll.employee.hourlyRateCents,
      regularDurationMs,
      overtimeDurationMs,
      compensatedBreakDurationMs: breakDurationMs,
      workedDurationMs: regularDurationMs + overtimeDurationMs,
      grossPayCents: grossPayCentsFor(
        totalMs,
        payroll.employee.hourlyRateCents,
      ),
      reconciliationId: payroll.reconciliation.id,
    },
  });

  await createPayrollPaymentNotification(employeeId, payment);

  return serializePayrollPayment(payment);
}

export async function listPayrollPayments(employeeId: string) {
  await getEmployeeOrThrow(employeeId);

  const payments = await prisma.payrollPayment.findMany({
    where: { userId: employeeId },
    orderBy: { periodTo: "desc" },
  });

  return payments.map(serializePayrollPayment);
}

export async function buildPayrollWorkbook(
  from: Date,
  to: Date,
): Promise<ExcelJS.Buffer> {
  const { rows } = await getPayrollForAllEmployees(from, to);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TimeTracker";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Payroll", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Employee", key: "employee", width: 26 },
    { header: "Email", key: "email", width: 28 },
    { header: "Regular Hours", key: "regularHours", width: 16 },
    { header: "Overtime Hours", key: "overtimeHours", width: 16 },
    { header: "Paid Break Hours", key: "breakHours", width: 18 },
    { header: "Hourly Rate", key: "rate", width: 14 },
    { header: "Est. Gross Pay", key: "grossPay", width: 16 },
  ];

  sheet.getRow(1).font = {
    name: "Arial",
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" },
  };
  sheet.getRow(1).alignment = { vertical: "middle" };

  for (const row of rows) {
    sheet.addRow({
      employee: row.employee.fullName,
      email: row.employee.email,
      regularHours: msToHours(row.system.regularDurationMs),
      overtimeHours: msToHours(row.system.overtimeDurationMs),
      breakHours: msToHours(row.system.compensatedBreakDurationMs),
      rate: row.employee.hourlyRateCents / 100,
      grossPay: row.estimatedGrossPayCents / 100,
    });
  }

  sheet.getColumn("rate").numFmt = '"$"#,##0.00';
  sheet.getColumn("grossPay").numFmt = '"$"#,##0.00';

  sheet.eachRow((row) => {
    row.font = { ...(row.font ?? {}), name: row.font?.name ?? "Arial" };
  });

  if (rows.length === 0) {
    sheet.addRow({ employee: "No employees yet" });
  }

  return workbook.xlsx.writeBuffer();
}

export async function listShiftEditRequests(
  status?: "PENDING" | "APPROVED" | "REJECTED",
) {
  const requests = await prisma.shiftEditRequest.findMany({
    where: { status: status ?? "PENDING" },
    orderBy: { createdAt: "desc" },
    include: editRequestInclude,
  });

  return requests.map(serializeEditRequest);
}

export async function reviewShiftEditRequest(
  requestId: string,
  reviewerId: string,
  decision: "APPROVED" | "REJECTED",
  reviewNote?: string,
) {
  const request = await prisma.shiftEditRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    throw new AppError("Edit request not found.", 404);
  }

  if (request.status !== "PENDING") {
    throw new AppError("This request has already been reviewed.", 409);
  }

  const now = new Date();

  if (decision === "APPROVED") {
    await prisma.$transaction([
      prisma.shiftEditRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedByUserId: reviewerId,
          reviewedAt: now,
          reviewNote,
        },
      }),
      prisma.shift.update({
        where: { id: request.shiftId },
        data: { clockOut: request.proposedClockOut, needsReview: false },
      }),
    ]);
  } else {
    await prisma.shiftEditRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedByUserId: reviewerId,
        reviewedAt: now,
        reviewNote,
      },
    });
  }

  const updated = await prisma.shiftEditRequest.findUniqueOrThrow({
    where: { id: requestId },
    include: editRequestInclude,
  });

  await createShiftEditRequestDecisionNotification(
    updated.requestedBy.id,
    decision,
    updated.shift.clockIn,
    requestId,
  );

  return serializeEditRequest(updated);
}
