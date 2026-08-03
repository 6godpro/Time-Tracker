import { apiClient } from "./client";
import type { Shift } from "@/types/shift";

export async function startBreakRequest(): Promise<Shift> {
  const { data } = await apiClient.post<{ shift: Shift }>("/break/start");
  return data.shift;
}

export async function endBreakRequest(): Promise<Shift> {
  const { data } = await apiClient.post<{ shift: Shift }>("/break/end");
  return data.shift;
}
