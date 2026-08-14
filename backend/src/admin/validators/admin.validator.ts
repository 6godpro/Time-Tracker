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

export const updateEmployeeJobSchema = z.object({
  jobId: z.string().trim().min(1, "Select a job"),
});

export type UpdateEmployeeJobInput = z.infer<typeof updateEmployeeJobSchema>;

export const updateEmployeeBreakOverrideSchema = z.object({
  breakIsPaidOverride: z.boolean().nullable(),
});

export type UpdateEmployeeBreakOverrideInput = z.infer<typeof updateEmployeeBreakOverrideSchema>;

export const updateEmployeeClientSchema = z.object({
  clientId: z.string().trim().min(1).nullable(),
});

export type UpdateEmployeeClientInput = z.infer<typeof updateEmployeeClientSchema>;

export const createClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(100),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const setClientActiveSchema = z.object({
  isActive: z.boolean(),
});

export type SetClientActiveInput = z.infer<typeof setClientActiveSchema>;

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
