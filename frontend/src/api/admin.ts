import { apiClient } from "./client";
import type { AdminShiftEditRequest, EmployeeShiftsResponse, EmployeeSummary } from "@/types/admin";
import type { ShiftEditRequestStatus } from "@/types/shift";

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