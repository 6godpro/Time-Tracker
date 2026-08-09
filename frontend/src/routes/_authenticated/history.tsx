import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { History } from "@/pages/History";

const historySearchSchema = z.object({
  tab: z.enum(["shifts", "payroll"]).optional(),
  paymentId: z.string().optional(),
  shiftEditRequestId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/history")({
  validateSearch: historySearchSchema,
  component: History,
});
