import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

type PayrollPaymentRecord = {
  id: string;
  periodFrom: Date;
  periodTo: Date;
  hourlyRateCents: number;
  workedDurationMs: number;
  grossPayCents: number;
  paidAt: Date;
  createdAt: Date;
};

function serializePayment(payment: PayrollPaymentRecord) {
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

export async function listPayrollPaymentsForPeriod(userId: string, year: number, month: number) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const payments: PayrollPaymentRecord[] = await prisma.payrollPayment.findMany({
    where: {
      userId,
      periodFrom: { lte: monthEnd },
      periodTo: { gte: monthStart },
    },
    orderBy: { periodTo: "desc" },
  });

  return payments.map(serializePayment);
}

export async function getPayrollPaymentById(userId: string, paymentId: string) {
  const payment = await prisma.payrollPayment.findUnique({ where: { id: paymentId } });

  if (!payment || payment.userId !== userId) {
    throw new AppError("Payment not found.", 404);
  }

  return serializePayment(payment);
}
