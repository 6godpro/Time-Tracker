import { useQuery } from "@tanstack/react-query";
import { listActiveJobsRequest } from "@/api/job";

export function useActiveJobs() {
  return useQuery({
    queryKey: ["jobs", "active"],
    queryFn: listActiveJobsRequest,
  });
}
