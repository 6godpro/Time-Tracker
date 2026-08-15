import { apiClient } from "./client";
import type { Shift } from "@/types/shift";

export interface CreateShiftEditRequestPayload {
  proposedClockOut: string;
  reason: string;
}

export async function clockInRequest(): Promise<Shift> {
  const { data } = await apiClient.post<{ shift: Shift }>("/shift/clock-in");
  return data.shift;
}

export async function clockOutRequest(): Promise<Shift> {
  const { data } = await apiClient.post<{ shift: Shift }>("/shift/clock-out");
  return data.shift;
}

export async function currentShiftRequest(): Promise<Shift | null> {
  const { data } = await apiClient.get<{ shift: Shift | null }>("/shift/current");
  return data.shift;
}

export async function shiftHistoryRequest(): Promise<Shift[]> {
  const { data } = await apiClient.get<{ shifts: Shift[] }>("/shift/history");
  return data.shifts;
}

export async function createShiftEditRequestRequest(
  shiftId: string,
  payload: CreateShiftEditRequestPayload,
): Promise<Shift> {
  const { data } = await apiClient.post<{ shift: Shift }>(`/shift/${shiftId}/edit-requests`, payload);
  return data.shift;
}

export async function pendingCorrectionsRequest(): Promise<Shift[]> {
  const { data } = await apiClient.get<{ shifts: Shift[] }>("/shift/pending-corrections");
  return data.shifts;
}
