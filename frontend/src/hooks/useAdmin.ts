import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  employeePayrollRequest,
  employeeShiftsRequest,
  exportEmployeeShifts,
  exportPayroll,
  listEmployeesRequest,
  listShiftEditRequestsRequest,
  payrollPaymentsRequest,
  payrollRequest,
  PayrollDateRange,
  recordPayrollPaymentRequest,
  ReviewShiftEditRequestPayload,
  reviewShiftEditRequestRequest,
  updateEmployeeRateRequest,
} from "../api/admin";
import type { ShiftEditRequestStatus } from "@/types/shift";

export function useEmployees() {
  return useQuery({
    queryKey: ["admin", "employees"],
    queryFn: listEmployeesRequest,
  });
}

export function useEmployeeShifts(employeeId: string | null) {
  return useQuery({
    queryKey: ["admin", "employees", employeeId, "shifts"],
    queryFn: () => employeeShiftsRequest(employeeId as string),
    enabled: employeeId !== null,
  });
}

export function useExportEmployeeShifts() {
  return useMutation({
    mutationFn: ({
      employeeId,
      employeeName,
    }: {
      employeeId: string;
      employeeName: string;
    }) => exportEmployeeShifts(employeeId, employeeName),
  });
}

const shiftEditRequestsKey = (status?: ShiftEditRequestStatus) =>
  ["admin", "shift-edit-requests", status ?? "PENDING"] as const;

export function useShiftEditRequests(status?: ShiftEditRequestStatus) {
  return useQuery({
    queryKey: shiftEditRequestsKey(status),
    queryFn: () => listShiftEditRequestsRequest(status),
  });
}

export function useReviewShiftEditRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string;
      payload: ReviewShiftEditRequestPayload;
    }) => reviewShiftEditRequestRequest(requestId, payload),
    onSuccess: () => {
      // Covers every status-filtered variant of the list (PENDING,
      // APPROVED, REJECTED, and the unfiltered default) rather than just
      // the one currently being viewed.
      queryClient.invalidateQueries({ queryKey: ["admin", "shift-edit-requests"] });
    },
  });
}

export function useUpdateEmployeeRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, hourlyRateCents }: { employeeId: string; hourlyRateCents: number }) =>
      updateEmployeeRateRequest(employeeId, hourlyRateCents),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
  });
}

export function useEmployeePayroll(employeeId: string | null, range: PayrollDateRange) {
  return useQuery({
    queryKey: ["admin", "employees", employeeId, "payroll", range],
    queryFn: () => employeePayrollRequest(employeeId as string, range),
    enabled: employeeId !== null,
  });
}

export function usePayroll(range: PayrollDateRange) {
  return useQuery({
    queryKey: ["admin", "payroll", range],
    queryFn: () => payrollRequest(range),
  });
}

export function useExportPayroll() {
  return useMutation({
    mutationFn: (range: PayrollDateRange) => exportPayroll(range),
  });
}

export function usePayrollPayments(employeeId: string | null) {
  return useQuery({
    queryKey: ["admin", "employees", employeeId, "payroll", "payments"],
    queryFn: () => payrollPaymentsRequest(employeeId as string),
    enabled: employeeId !== null,
  });
}

export function useRecordPayrollPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, range }: { employeeId: string; range: PayrollDateRange }) =>
      recordPayrollPaymentRequest(employeeId, range),
    onSuccess: (_payment, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "employees", variables.employeeId, "payroll", "payments"],
      });
    },
  });
}
