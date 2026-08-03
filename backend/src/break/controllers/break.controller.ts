import { Request, Response } from "express";
import { endBreak, startBreak } from "../services/break.service";

export async function startBreakHandler(req: Request, res: Response) {
  const shift = await startBreak(req.userId as string);
  res.status(201).json({ shift });
}

export async function endBreakHandler(req: Request, res: Response) {
  const shift = await endBreak(req.userId as string);
  res.status(200).json({ shift });
}
