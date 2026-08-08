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

export const updateHourlyRateSchema = z.object({
  hourlyRateCents: z
    .number()
    .int("Rate must be a whole number of cents.")
    .min(0, "Rate can't be negative.")
    .max(1_000_000, "That rate looks too high — enter it in cents (e.g. $24.50 = 2450)."),
});

export type UpdateHourlyRateInput = z.infer<typeof updateHourlyRateSchema>;

export const payrollRangeQuerySchema = z
  .object({
    from: z.coerce.date({ errorMap: () => ({ message: "A valid \"from\" date is required." }) }),
    to: z.coerce.date({ errorMap: () => ({ message: "A valid \"to\" date is required." }) }),
  })
  .refine((data) => data.to.getTime() >= data.from.getTime(), {
    message: "\"to\" must be on or after \"from\".",
    path: ["to"],
  });

export type PayrollRangeQuery = z.infer<typeof payrollRangeQuerySchema>;