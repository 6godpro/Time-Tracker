import { Request, Response } from "express";
import {
  buildEmployeeShiftsWorkbook,
  getEmployeeShifts,
  listEmployees,
  listShiftEditRequests,
  reviewShiftEditRequest,
} from "../services/admin.service";
import { listShiftEditRequestsQuerySchema, reviewShiftEditRequestSchema } from "../validators/admin.validator";

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