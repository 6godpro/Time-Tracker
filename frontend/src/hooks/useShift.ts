import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clockInRequest,
  clockOutRequest,
  createShiftEditRequestRequest,
  CreateShiftEditRequestPayload,
  currentShiftRequest,
  extendShiftRequest,
  ExtendShiftPayload,
  pendingCorrectionsRequest,
  shiftHistoryRequest,
} from "@/api/shift";

export const shiftKeys = {
  current: ["shift", "current"] as const,
  history: ["shift", "history"] as const,
  pendingCorrections: ["shift", "pending-corrections"] as const,
};

export function useCurrentShift() {
  return useQuery({
    queryKey: shiftKeys.current,
    queryFn: currentShiftRequest,
    refetchInterval: 30_000,
  });
}

export function useShiftHistory() {
  return useQuery({
    queryKey: shiftKeys.history,
    queryFn: shiftHistoryRequest,
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clockInRequest,
    onSuccess: (shift) => {
      queryClient.setQueryData(shiftKeys.current, shift);
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clockOutRequest,
    onSuccess: () => {
      queryClient.setQueryData(shiftKeys.current, null);
      queryClient.invalidateQueries({ queryKey: shiftKeys.history });
    },
  });
}

export function useCreateShiftEditRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, payload }: { shiftId: string; payload: CreateShiftEditRequestPayload }) =>
      createShiftEditRequestRequest(shiftId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.history });
      queryClient.invalidateQueries({ queryKey: shiftKeys.pendingCorrections });
    },
  });
}

export function usePendingCorrections() {
  return useQuery({
    queryKey: shiftKeys.pendingCorrections,
    queryFn: pendingCorrectionsRequest,
  });
}

export function useExtendShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ExtendShiftPayload) => extendShiftRequest(payload),
    onSuccess: (shift) => {
      queryClient.setQueryData(shiftKeys.current, shift);
    },
  });
}