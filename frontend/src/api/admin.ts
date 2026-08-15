import { apiClient } from "./client";
import type {
  AdminShiftEditRequest,
  DurationBreakdown,
  EmployeePayroll,
  EmployeeShiftsResponse,
  EmployeeSummary,
  PayrollPayment,
  PayrollReconciliation,
  PayrollSummary,
} from "@/types/admin";
import type { ShiftEditRequestStatus } from "@/types/shift";
import type { Client, Job } from "@/types/job";

export interface PayrollDateRange {
  from: string;
  to: string;
}

function toRangeParams({ from, to }: PayrollDateRange) {
  return { from, to: `${to}T23:59:59.999` };
}

export async function listEmployeesRequest(): Promise<EmployeeSummary[]> {
  const { data } = await apiClient.get<{ employees: EmployeeSummary[] }>("/admin/employees");
  return data.employees;
}

export async function employeeShiftsRequest(employeeId: string): Promise<EmployeeShiftsResponse> {
  const { data } = await apiClient.get<EmployeeShiftsResponse>(`/admin/employees/${employeeId}/shifts`);
  return data;
}

/**
 * Downloads the xlsx export for one employee. Uses axios (not a plain
 * <a href>) so the Authorization header goes with the request, then
 * saves the returned blob via a temporary object URL.
 */
export async function exportEmployeeShifts(employeeId: string, employeeName: string): Promise<void> {
  const response = await apiClient.get(`/admin/employees/${employeeId}/shifts/export`, {
    responseType: "blob",
  });

  const filename = `${employeeName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-shifts.xlsx`;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function listShiftEditRequestsRequest(
  status?: ShiftEditRequestStatus,
): Promise<AdminShiftEditRequest[]> {
  const { data } = await apiClient.get<{ requests: AdminShiftEditRequest[] }>("/admin/shift-edit-requests", {
    params: status ? { status } : undefined,
  });
  return data.requests;
}

export interface ReviewShiftEditRequestPayload {
  decision: "APPROVED" | "REJECTED";
  reviewNote?: string;
}

export async function reviewShiftEditRequestRequest(
  requestId: string,
  payload: ReviewShiftEditRequestPayload,
): Promise<AdminShiftEditRequest> {
  const { data } = await apiClient.patch<{ request: AdminShiftEditRequest }>(
    `/admin/shift-edit-requests/${requestId}`,
    payload,
  );
  return data.request;
}

export async function updateEmployeeRateRequest(
  employeeId: string,
  hourlyRateCents: number,
): Promise<{ id: string; hourlyRateCents: number }> {
  const { data } = await apiClient.patch<{ employee: { id: string; hourlyRateCents: number } }>(
    `/admin/employees/${employeeId}/rate`,
    { hourlyRateCents },
  );
  return data.employee;
}

export async function updateEmployeeJobRequest(
  employeeId: string,
  jobId: string,
): Promise<{ id: string; currentJobId: string }> {
  const { data } = await apiClient.patch<{ employee: { id: string; currentJobId: string } }>(
    `/admin/employees/${employeeId}/job`,
    { jobId },
  );
  return data.employee;
}

export async function updateEmployeeBreakOverrideRequest(
  employeeId: string,
  breakIsPaidOverride: boolean | null,
): Promise<{ id: string; breakIsPaidOverride: boolean | null }> {
  const { data } = await apiClient.patch<{ employee: { id: string; breakIsPaidOverride: boolean | null } }>(
    `/admin/employees/${employeeId}/break-override`,
    { breakIsPaidOverride },
  );
  return data.employee;
}

export async function updateEmployeeClientRequest(
  employeeId: string,
  clientId: string | null,
): Promise<{ id: string; clientId: string | null }> {
  const { data } = await apiClient.patch<{ employee: { id: string; clientId: string | null } }>(
    `/admin/employees/${employeeId}/client`,
    { clientId },
  );
  return data.employee;
}

export async function listAllJobsRequest(): Promise<Job[]> {
  const { data } = await apiClient.get<{ jobs: Job[] }>("/admin/jobs");
  return data.jobs;
}

export async function createJobRequest(input: {
  name: string;
  minimumWorkMinutes: number;
  breakIsPaidByDefault: boolean;
}): Promise<Job> {
  const { data } = await apiClient.post<{ job: Job }>("/admin/jobs", input);
  return data.job;
}

export async function updateJobRequest(
  jobId: string,
  input: Partial<{ name: string; minimumWorkMinutes: number; breakIsPaidByDefault: boolean }>,
): Promise<Job> {
  const { data } = await apiClient.patch<{ job: Job }>(`/admin/jobs/${jobId}`, input);
  return data.job;
}

export async function setJobActiveRequest(jobId: string, isActive: boolean): Promise<Job> {
  const { data } = await apiClient.patch<{ job: Job }>(`/admin/jobs/${jobId}/active`, { isActive });
  return data.job;
}

export async function listClientsRequest(): Promise<Client[]> {
  const { data } = await apiClient.get<{ clients: Client[] }>("/admin/clients");
  return data.clients;
}

export async function createClientRequest(name: string): Promise<Client> {
  const { data } = await apiClient.post<{ client: Client }>("/admin/clients", { name });
  return data.client;
}

export async function setClientActiveRequest(clientId: string, isActive: boolean): Promise<Client> {
  const { data } = await apiClient.patch<{ client: Client }>(`/admin/clients/${clientId}/active`, { isActive });
  return data.client;
}

export async function getReconciliationRequest(
  employeeId: string,
  range: PayrollDateRange,
): Promise<PayrollReconciliation | null> {
  const { data } = await apiClient.get<{ reconciliation: PayrollReconciliation | null }>(
    `/admin/employees/${employeeId}/payroll/reconciliation`,
    { params: toRangeParams(range) },
  );
  return data.reconciliation;
}

export async function createReconciliationRequest(
  employeeId: string,
  range: PayrollDateRange,
): Promise<PayrollReconciliation> {
  const { data } = await apiClient.post<{ reconciliation: PayrollReconciliation }>(
    `/admin/employees/${employeeId}/payroll/reconciliation`,
    toRangeParams(range),
  );
  return data.reconciliation;
}

export async function submitClientFiguresRequest(
  reconciliationId: string,
  figures: DurationBreakdown,
): Promise<PayrollReconciliation> {
  const { data } = await apiClient.post<{ reconciliation: PayrollReconciliation }>(
    `/admin/payroll/reconciliation/${reconciliationId}/client-figures`,
    figures,
  );
  return data.reconciliation;
}

export async function resolveReconciliationRequest(
  reconciliationId: string,
  input: DurationBreakdown & { reason: string },
): Promise<PayrollReconciliation> {
  const { data } = await apiClient.post<{ reconciliation: PayrollReconciliation }>(
    `/admin/payroll/reconciliation/${reconciliationId}/resolve`,
    input,
  );
  return data.reconciliation;
}

export async function employeePayrollRequest(
  employeeId: string,
  range: PayrollDateRange,
): Promise<EmployeePayroll> {
  const { data } = await apiClient.get<{ payroll: EmployeePayroll }>(
    `/admin/employees/${employeeId}/payroll`,
    { params: toRangeParams(range) },
  );
  return data.payroll;
}

export async function payrollRequest(range: PayrollDateRange): Promise<PayrollSummary> {
  const { data } = await apiClient.get<{ payroll: PayrollSummary }>("/admin/payroll", {
    params: toRangeParams(range),
  });
  return data.payroll;
}

export async function recordPayrollPaymentRequest(
  employeeId: string,
  range: PayrollDateRange,
): Promise<PayrollPayment> {
  const { data } = await apiClient.post<{ payment: PayrollPayment }>(
    `/admin/employees/${employeeId}/payroll/payments`,
    toRangeParams(range),
  );
  return data.payment;
}

export async function payrollPaymentsRequest(employeeId: string): Promise<PayrollPayment[]> {
  const { data } = await apiClient.get<{ payments: PayrollPayment[] }>(
    `/admin/employees/${employeeId}/payroll/payments`,
  );
  return data.payments;
}

export async function exportPayroll(range: PayrollDateRange): Promise<void> {
  const response = await apiClient.get("/admin/payroll/export", {
    params: toRangeParams(range),
    responseType: "blob",
  });

  const filename = `payroll-${range.from}-to-${range.to}.xlsx`;
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
