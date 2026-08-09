import { apiClient } from "./client";
import type { PayrollPayment } from "@/types/admin";

export interface PayrollHistoryFilter {
  year: number;
  month: number;
}

export async function myPayrollPaymentsRequest(filter: PayrollHistoryFilter): Promise<PayrollPayment[]> {
  const { data } = await apiClient.get<{ payments: PayrollPayment[] }>("/payroll/payments", {
    params: filter,
  });
  return data.payments;
}

export async function myPayrollPaymentRequest(paymentId: string): Promise<PayrollPayment> {
  const { data } = await apiClient.get<{ payment: PayrollPayment }>(`/payroll/payments/${paymentId}`);
  return data.payment;
}
