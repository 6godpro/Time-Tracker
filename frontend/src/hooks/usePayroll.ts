import { useQuery } from "@tanstack/react-query";
import { myPayrollPaymentRequest, myPayrollPaymentsRequest, PayrollHistoryFilter } from "../api/payroll";

export function useMyPayrollPayments(filter: PayrollHistoryFilter | null) {
  return useQuery({
    queryKey: ["payroll", "payments", filter],
    queryFn: () => myPayrollPaymentsRequest(filter as PayrollHistoryFilter),
    enabled: filter !== null,
  });
}

export function useMyPayrollPayment(paymentId: string | null) {
  return useQuery({
    queryKey: ["payroll", "payments", "detail", paymentId],
    queryFn: () => myPayrollPaymentRequest(paymentId as string),
    enabled: paymentId !== null,
  });
}
