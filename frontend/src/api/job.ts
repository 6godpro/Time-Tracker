import { apiClient } from "./client";
import type { Job } from "@/types/job";

export async function listActiveJobsRequest(): Promise<Job[]> {
  const { data } = await apiClient.get<{ jobs: Job[] }>("/jobs");
  return data.jobs;
}

export async function JobRequest(): Promise<Job> {
  const { data } = await apiClient.get<{ job: Job }>("/jobs");
  return data.job;
}