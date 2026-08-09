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
  createHourlyRateChangeNotification,
  createPayrollPaymentNotification,
  createShiftEditRequestDecisionNotification,
} from "@/notification/services/notification.service";

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
      jobTitle: true,
      email: true,
      role: true,
      createdAt: true,
      hourlyRateCents: true,
      _count: { select: { shifts: true } },
      shifts: {
        where: { status: { in: ["WORKING", "ON_BREAK"] } },
        select: { status: true },
        take: 1,
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: fullName(user),
    jobTitle: user.jobTitle,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    hourlyRateCents: user.hourlyRateCents,
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
      jobTitle: true,
      email: true,
      role: true,
      hourlyRateCents: true,
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

  if (hourlyRateCents != employee.hourlyRateCents) {
    await createHourlyRateChangeNotification(
      employeeId,
      employee.hourlyRateCents,
      hourlyRateCents,
    );
  }

  return updated;
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
  workbook.creator = "TimeTrack";
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

function sumWorkedMs(shifts: { workedDurationMs: number }[]): number {
  return shifts.reduce((total, shift) => total + shift.workedDurationMs, 0);
}

function grossPayCentsFor(workedMs: number, hourlyRateCents: number): number {
  return Math.round((workedMs / 3_600_000) * hourlyRateCents);
}

export async function getEmployeePayroll(
  employeeId: string,
  from: Date,
  to: Date,
) {
  const employee = await getEmployeeOrThrow(employeeId);
  const shifts = await getCompletedShiftsForUserInRange(employeeId, from, to);
  const workedDurationMs = sumWorkedMs(shifts);
  const unresolvedShiftCount = shifts.filter(
    (shift) => shift.needsReview,
  ).length;

  return {
    employee: {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      hourlyRateCents: employee.hourlyRateCents,
    },
    from,
    to,
    shiftCount: shifts.length,
    workedDurationMs,
    grossPayCents: grossPayCentsFor(workedDurationMs, employee.hourlyRateCents),
    unresolvedShiftCount,
  };
}

type PayrollEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  hourlyRateCents: number;
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
    },
  });

  const rows = await Promise.all(
    employees.map(async (employee: PayrollEmployee) => {
      const shifts = await getCompletedShiftsForUserInRange(
        employee.id,
        from,
        to,
      );
      const workedDurationMs = sumWorkedMs(shifts);

      return {
        employee: {
          id: employee.id,
          fullName: fullName(employee),
          email: employee.email,
          hourlyRateCents: employee.hourlyRateCents,
        },
        shiftCount: shifts.length,
        workedDurationMs,
        grossPayCents: grossPayCentsFor(
          workedDurationMs,
          employee.hourlyRateCents,
        ),
      };
    }),
  );

  return {
    from,
    to,
    rows,
    totalGrossPayCents: rows.reduce(
      (total, row) => total + row.grossPayCents,
      0,
    ),
  };
}

type PayrollPaymentRow = {
  id: string;
  periodFrom: Date;
  periodTo: Date;
  hourlyRateCents: number;
  workedDurationMs: number;
  grossPayCents: number;
  paidAt: Date;
  createdAt: Date;
};

function serializePayrollPayment(payment: PayrollPaymentRow) {
  return {
    id: payment.id,
    periodFrom: payment.periodFrom,
    periodTo: payment.periodTo,
    hourlyRateCents: payment.hourlyRateCents,
    workedDurationMs: payment.workedDurationMs,
    grossPayCents: payment.grossPayCents,
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

  const duplicate = await prisma.payrollPayment.findFirst({
    where: { userId: employeeId, periodFrom: from, periodTo: to },
  });

  if (payroll.unresolvedShiftCount > 0) {
    throw new AppError(
      `This period includes ${payroll.unresolvedShiftCount} shift${payroll.unresolvedShiftCount === 1 ? "" : "s"} still awaiting a correction request review. Resolve ${payroll.unresolvedShiftCount === 1 ? "it" : "them"} before recording this payment.`,
      409,
    );
  }

  if (duplicate) {
    throw new AppError(
      "A payment for this exact period has already been recorded.",
      409,
    );
  }

  const payment = await prisma.payrollPayment.create({
    data: {
      userId: employeeId,
      periodFrom: from,
      periodTo: to,
      hourlyRateCents: payroll.employee.hourlyRateCents,
      workedDurationMs: payroll.workedDurationMs,
      grossPayCents: payroll.grossPayCents,
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
  workbook.creator = "TimeTrack";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Payroll", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Employee", key: "employee", width: 26 },
    { header: "Email", key: "email", width: 28 },
    { header: "Hours Worked", key: "hours", width: 16 },
    { header: "Hourly Rate", key: "rate", width: 14 },
    { header: "Gross Pay", key: "grossPay", width: 14 },
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
      hours: msToHours(row.workedDurationMs),
      rate: row.employee.hourlyRateCents / 100,
      grossPay: row.grossPayCents / 100,
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

// Defaults to PENDING-only when no status is given — that's the queue an
// admin actually needs to act on day to day. Passing an explicit status
// (including APPROVED/REJECTED) lets the UI show resolved history too.
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
    // Both writes happen together: approving a request with no visible
    // effect on the shift (or applying the new clockOut without ever
    // marking the request approved) would leave the two out of sync.
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
    // Rejecting leaves the shift untouched — needsReview (if it was set)
    // stays true, so the employee can see it's still unresolved and
    // submit another request.
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
