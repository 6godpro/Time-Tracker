import { Request, Response } from "express";
import {
  buildEmployeeShiftsWorkbook,
  buildPayrollWorkbook,
  getEmployeePayroll,
  getEmployeeShifts,
  getPayrollForAllEmployees,
  listEmployees,
  listPayrollPayments,
  listShiftEditRequests,
  recordPayrollPayment,
  reviewShiftEditRequest,
  updateEmployeeRate,
} from "../services/admin.service";
import {
  listShiftEditRequestsQuerySchema,
  payrollRangeQuerySchema,
  reviewShiftEditRequestSchema,
  updateHourlyRateSchema,
} from "../validators/admin.validator";

export async function listEmployeesHandler(_req: Request, res: Response) {
  const employees = await listEmployees();
  res.status(200).json({ employees });
}

export async function employeeShiftsHandler(req: Request, res: Response) {
  const result = await getEmployeeShifts(req.params.employeeId);
  res.status(200).json(result);
}

export async function exportEmployeeShiftsHandler(req: Request, res: Response) {
  const { employee, buffer } = await buildEmployeeShiftsWorkbook(req.params.employeeId);

  const filename = `${employee.fullName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-shifts.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function listShiftEditRequestsHandler(req: Request, res: Response) {
  const { status } = listShiftEditRequestsQuerySchema.parse(req.query);
  const requests = await listShiftEditRequests(status);
  res.status(200).json({ requests });
}

export async function reviewShiftEditRequestHandler(req: Request, res: Response) {
  const input = reviewShiftEditRequestSchema.parse(req.body);
  const request = await reviewShiftEditRequest(
    req.params.requestId,
    req.userId as string,
    input.decision,
    input.reviewNote,
  );
  res.status(200).json({ request });
}

export async function updateHourlyRateHandler(req: Request, res: Response) {
  const input = updateHourlyRateSchema.parse(req.body);
  const employee = await updateEmployeeRate(req.params.employeeId, input.hourlyRateCents);
  res.status(200).json({ employee });
}

export async function employeePayrollHandler(req: Request, res: Response) {
  const { from, to } = payrollRangeQuerySchema.parse(req.query);
  const payroll = await getEmployeePayroll(req.params.employeeId, from, to);
  res.status(200).json({ payroll });
}

export async function payrollHandler(req: Request, res: Response) {
  const { from, to } = payrollRangeQuerySchema.parse(req.query);
  const payroll = await getPayrollForAllEmployees(from, to);
  res.status(200).json({ payroll });
}

export async function recordPayrollPaymentHandler(req: Request, res: Response) {
  const { from, to } = payrollRangeQuerySchema.parse(req.body);
  const payment = await recordPayrollPayment(req.params.employeeId, from, to);
  res.status(201).json({ payment });
}

export async function listPayrollPaymentsHandler(req: Request, res: Response) {
  const payments = await listPayrollPayments(req.params.employeeId);
  res.status(200).json({ payments });
}

export async function exportPayrollHandler(req: Request, res: Response) {
  const { from, to } = payrollRangeQuerySchema.parse(req.query);
  const buffer = await buildPayrollWorkbook(from, to);

  const filename = `payroll-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}
