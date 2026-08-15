import { Request, Response } from "express";
import {
  clockIn,
  clockOut,
  createShiftEditRequest,
  getCurrentShift,
  getShiftHistory,
  getUnresolvedAutoClosedShifts,
} from "../services/shift.service";
import {
  createShiftEditRequestSchema,
} from "../validators/shift.validators";

export async function clockInHandler(req: Request, res: Response) {
  const shift = await clockIn(req.userId as string);
  res.status(201).json({ shift });
}

export async function clockOutHandler(req: Request, res: Response) {
  const shift = await clockOut(req.userId as string);
  res.status(200).json({ shift });
}

export async function currentShiftHandler(req: Request, res: Response) {
  const shift = await getCurrentShift(req.userId as string);
  res.status(200).json({ shift });
}

export async function historyHandler(req: Request, res: Response) {
  const shifts = await getShiftHistory(req.userId as string);
  res.status(200).json({ shifts });
}

export async function createShiftEditRequestHandler(
  req: Request,
  res: Response,
) {
  const input = createShiftEditRequestSchema.parse(req.body);
  const shift = await createShiftEditRequest(
    req.userId as string,
    req.params.shiftId,
    input.proposedClockOut,
    input.reason,
  );
  res.status(201).json({ shift });
}

export async function pendingCorrectionsHandler(req: Request, res: Response) {
  const shifts = await getUnresolvedAutoClosedShifts(req.userId as string);
  res.status(200).json({ shifts });
}
