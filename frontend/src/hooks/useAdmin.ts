import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  employeeShiftsRequest,
  exportEmployeeShifts,
  listEmployeesRequest,
  listShiftEditRequestsRequest,
  ReviewShiftEditRequestPayload,
  reviewShiftEditRequestRequest,
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