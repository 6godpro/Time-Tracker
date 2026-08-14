import { Request, Response } from "express";
import {
  buildEmployeeShiftsWorkbook,
  buildPayrollWorkbook,
  createClient,
  getEmployeePayroll,
  getEmployeeShifts,
  getPayrollForAllEmployees,
  listClients,
  listEmployees,
  listPayrollPayments,
  listShiftEditRequests,
  recordPayrollPayment,
  reviewShiftEditRequest,
  setClientActive,
  updateEmployeeBreakOverride,
  updateEmployeeClient,
  updateEmployeeJob,
  updateEmployeeRate,
} from "../services/admin.service";
import {
  createClientSchema,
  listShiftEditRequestsQuerySchema,
  payrollRangeQuerySchema,
  reviewShiftEditRequestSchema,
  setClientActiveSchema,
  updateEmployeeBreakOverrideSchema,
  updateEmployeeClientSchema,
  updateEmployeeJobSchema,
  updateHourlyRateSchema,
} from "../validators/admin.validator";
import {
  createJob,
  listAllJobs,
  setJobActive,
  updateJob,
} from "../../job/services/job.service";
import {
  createJobSchema,
  setJobActiveSchema,
  updateJobSchema,
} from "../../job/validators/job.validators";
import {
  createOrGetReconciliation,
  getReconciliation,
  resolveReconciliation,
  submitClientFigures,
} from "../../reconciliation/services/reconciliation.service";
import {
  reconciliationPeriodQuerySchema,
  resolveReconciliationSchema,
  submitClientFiguresSchema,
} from "../../reconciliation/validators/reconciliation.validators";

export async function listEmployeesHandler(_req: Request, res: Response) {
  const employees = await listEmployees();
  res.status(200).json({ employees });
}

export async function employeeShiftsHandler(req: Request, res: Response) {
  const result = await getEmployeeShifts(req.params.employeeId);
  res.status(200).json(result);
}

export async function exportEmployeeShiftsHandler(req: Request, res: Response) {
  const { employee, buffer } = await buildEmployeeShiftsWorkbook(
    req.params.employeeId,
  );

  const filename = `${employee.fullName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-shifts.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function listShiftEditRequestsHandler(
  req: Request,
  res: Response,
) {
  const { status } = listShiftEditRequestsQuerySchema.parse(req.query);
  const requests = await listShiftEditRequests(status);
  res.status(200).json({ requests });
}

export async function reviewShiftEditRequestHandler(
  req: Request,
  res: Response,
) {
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
  const employee = await updateEmployeeRate(
    req.params.employeeId,
    input.hourlyRateCents,
  );
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

export async function updateEmployeeJobHandler(req: Request, res: Response) {
  const input = updateEmployeeJobSchema.parse(req.body);
  const employee = await updateEmployeeJob(req.params.employeeId, input.jobId);
  res.status(200).json({ employee });
}

export async function updateEmployeeBreakOverrideHandler(
  req: Request,
  res: Response,
) {
  const input = updateEmployeeBreakOverrideSchema.parse(req.body);
  const employee = await updateEmployeeBreakOverride(
    req.params.employeeId,
    input.breakIsPaidOverride,
  );
  res.status(200).json({ employee });
}

export async function updateEmployeeClientHandler(req: Request, res: Response) {
  const input = updateEmployeeClientSchema.parse(req.body);
  const employee = await updateEmployeeClient(
    req.params.employeeId,
    input.clientId,
  );
  res.status(200).json({ employee });
}

export async function listClientsHandler(_req: Request, res: Response) {
  const clients = await listClients();
  res.status(200).json({ clients });
}

export async function createClientHandler(req: Request, res: Response) {
  const input = createClientSchema.parse(req.body);
  const client = await createClient(input.name);
  res.status(201).json({ client });
}

export async function setClientActiveHandler(req: Request, res: Response) {
  const input = setClientActiveSchema.parse(req.body);
  const client = await setClientActive(req.params.clientId, input.isActive);
  res.status(200).json({ client });
}

export async function adminListJobsHandler(_req: Request, res: Response) {
  const jobs = await listAllJobs();
  res.status(200).json({ jobs });
}

export async function adminCreateJobHandler(req: Request, res: Response) {
  const input = createJobSchema.parse(req.body);
  const job = await createJob(input);
  res.status(201).json({ job });
}

export async function adminUpdateJobHandler(req: Request, res: Response) {
  const input = updateJobSchema.parse(req.body);
  const job = await updateJob(req.params.jobId, input);
  res.status(200).json({ job });
}

export async function adminSetJobActiveHandler(req: Request, res: Response) {
  const input = setJobActiveSchema.parse(req.body);
  const job = await setJobActive(req.params.jobId, input.isActive);
  res.status(200).json({ job });
}

export async function getReconciliationHandler(req: Request, res: Response) {
  const { from, to } = reconciliationPeriodQuerySchema.parse(req.query);
  const reconciliation = await getReconciliation(
    req.params.employeeId,
    from,
    to,
  );
  res.status(200).json({ reconciliation });
}

export async function createReconciliationHandler(req: Request, res: Response) {
  const { from, to } = reconciliationPeriodQuerySchema.parse(req.body);
  const reconciliation = await createOrGetReconciliation(
    req.params.employeeId,
    from,
    to,
  );
  res.status(201).json({ reconciliation });
}

export async function submitClientFiguresHandler(req: Request, res: Response) {
  const input = submitClientFiguresSchema.parse(req.body);
  const reconciliation = await submitClientFigures(
    req.params.reconciliationId,
    input,
  );
  res.status(200).json({ reconciliation });
}

export async function resolveReconciliationHandler(
  req: Request,
  res: Response,
) {
  const input = resolveReconciliationSchema.parse(req.body);
  const reconciliation = await resolveReconciliation(
    req.params.reconciliationId,
    req.userId as string,
    input,
  );
  res.status(200).json({ reconciliation });
}

export async function exportPayrollHandler(req: Request, res: Response) {
  const { from, to } = payrollRangeQuerySchema.parse(req.query);
  const buffer = await buildPayrollWorkbook(from, to);

  const filename = `payroll-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}
