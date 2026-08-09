import { Request, Response } from "express";
import { getPayrollPaymentById, listPayrollPaymentsForPeriod } from "../services/payroll.service";
import { payrollHistoryQuerySchema } from "../validators/payroll.validators";

export async function myPayrollPaymentsHandler(req: Request, res: Response) {
  const { year, month } = payrollHistoryQuerySchema.parse(req.query);
  const payments = await listPayrollPaymentsForPeriod(req.userId as string, year, month);
  res.status(200).json({ payments });
}

export async function myPayrollPaymentHandler(req: Request, res: Response) {
  const payment = await getPayrollPaymentById(req.userId as string, req.params.paymentId);
  res.status(200).json({ payment });
}
