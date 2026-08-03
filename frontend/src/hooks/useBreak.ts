import { useMutation, useQueryClient } from "@tanstack/react-query";
import { endBreakRequest, startBreakRequest } from "@/api/break";
import { shiftKeys } from "./useShift";

export function useStartBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startBreakRequest,
    onSuccess: (shift) => {
      queryClient.setQueryData(shiftKeys.current, shift);
    },
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endBreakRequest,
    onSuccess: (shift) => {
      queryClient.setQueryData(shiftKeys.current, shift);
    },
  });
}
