import { useQuery } from "@tanstack/react-query";
import { meRequest } from "@/api/auth";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => (await meRequest()).user,
    staleTime: 5 * 60 * 1000,
  });
}
