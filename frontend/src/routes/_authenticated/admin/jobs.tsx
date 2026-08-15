import { createFileRoute } from "@tanstack/react-router";
import { AdminJobs } from "@/pages/Admin";

export const Route = createFileRoute("/_authenticated/admin/jobs")({
  component: AdminJobs,
});
