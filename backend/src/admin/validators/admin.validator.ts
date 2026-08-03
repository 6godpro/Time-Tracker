import { z } from "zod";

export const listShiftEditRequestsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
});

export type ListShiftEditRequestsQuery = z.infer<typeof listShiftEditRequestsQuerySchema>;

export const reviewShiftEditRequestSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "Decision must be either APPROVED or REJECTED" }),
  }),
  reviewNote: z.string().trim().max(500, "Keep it under 500 characters").optional(),
});

export type ReviewShiftEditRequestInput = z.infer<typeof reviewShiftEditRequestSchema>;