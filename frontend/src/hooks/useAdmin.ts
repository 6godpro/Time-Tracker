import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClientRequest,
  createJobRequest,
  createReconciliationRequest,
  employeePayrollRequest,
  employeeShiftsRequest,
  exportEmployeeShifts,
  exportPayroll,
  getReconciliationRequest,
  listAllJobsRequest,
  listClientsRequest,
  listEmployeesRequest,
  listShiftEditRequestsRequest,
  payrollPaymentsRequest,
  payrollRequest,
  PayrollDateRange,
  recordPayrollPaymentRequest,
  resolveReconciliationRequest,
  ReviewShiftEditRequestPayload,
  reviewShiftEditRequestRequest,
  setClientActiveRequest,
  setJobActiveRequest,
  submitClientFiguresRequest,
  updateEmployeeBreakOverrideRequest,
  updateEmployeeClientRequest,
  updateEmployeeJobRequest,
  updateEmployeeRateRequest,
  updateJobRequest,
} from "../api/admin";
import type { ShiftEditRequestStatus } from "@/types/shift";
import type { DurationBreakdown } from "@/types/admin";

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

export function useUpdateEmployeeJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, jobId }: { employeeId: string; jobId: string }) =>
      updateEmployeeJobRequest(employeeId, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
  });
}

export function useUpdateEmployeeBreakOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, breakIsPaidOverride }: { employeeId: string; breakIsPaidOverride: boolean | null }) =>
      updateEmployeeBreakOverrideRequest(employeeId, breakIsPaidOverride),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
  });
}

export function useUpdateEmployeeClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, clientId }: { employeeId: string; clientId: string | null }) =>
      updateEmployeeClientRequest(employeeId, clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
  });
}

export function useAdminJobs() {
  return useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: listAllJobsRequest,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJobRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "active"] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      input,
    }: {
      jobId: string;
      input: Partial<{ name: string; minimumWorkMinutes: number; breakIsPaidByDefault: boolean }>;
    }) => updateJobRequest(jobId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "active"] });
    },
  });
}

export function useSetJobActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, isActive }: { jobId: string; isActive: boolean }) => setJobActiveRequest(jobId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "active"] });
    },
  });
}

export function useAdminClients() {
  return useQuery({
    queryKey: ["admin", "clients"],
    queryFn: listClientsRequest,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
    },
  });
}

export function useSetClientActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, isActive }: { clientId: string; isActive: boolean }) =>
      setClientActiveRequest(clientId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
    },
  });
}

export function useReconciliation(employeeId: string | null, range: PayrollDateRange) {
  return useQuery({
    queryKey: ["admin", "employees", employeeId, "reconciliation", range],
    queryFn: () => getReconciliationRequest(employeeId as string, range),
    enabled: employeeId !== null,
  });
}

function invalidateReconciliationAndPayroll(
  queryClient: ReturnType<typeof useQueryClient>,
  employeeId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["admin", "employees", employeeId, "reconciliation"] });
  queryClient.invalidateQueries({ queryKey: ["admin", "employees", employeeId, "payroll"] });
}

export function useCreateReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, range }: { employeeId: string; range: PayrollDateRange }) =>
      createReconciliationRequest(employeeId, range),
    onSuccess: (_reconciliation, variables) => {
      invalidateReconciliationAndPayroll(queryClient, variables.employeeId);
    },
  });
}

export function useSubmitClientFigures() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reconciliationId,
      figures,
    }: {
      employeeId: string;
      reconciliationId: string;
      figures: DurationBreakdown;
    }) => submitClientFiguresRequest(reconciliationId, figures),
    onSuccess: (_reconciliation, variables) => {
      invalidateReconciliationAndPayroll(queryClient, variables.employeeId);
    },
  });
}

export function useResolveReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reconciliationId,
      input,
    }: {
      employeeId: string;
      reconciliationId: string;
      input: DurationBreakdown & { reason: string };
    }) => resolveReconciliationRequest(reconciliationId, input),
    onSuccess: (_reconciliation, variables) => {
      invalidateReconciliationAndPayroll(queryClient, variables.employeeId);
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
