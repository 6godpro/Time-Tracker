import { apiClient } from "./client";
import type {
  AdminShiftEditRequest,
  EmployeePayroll,
  EmployeeShiftsResponse,
  EmployeeSummary,
  PayrollPayment,
  PayrollSummary,
} from "@/types/admin";
import type { ShiftEditRequestStatus } from "@/types/shift";

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
