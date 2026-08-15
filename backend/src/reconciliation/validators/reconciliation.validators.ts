import { z } from "zod";

export const reconciliationPeriodQuerySchema = z
  .object({
    from: z.coerce.date({ errorMap: () => ({ message: "A valid \"from\" date is required." }) }),
    to: z.coerce.date({ errorMap: () => ({ message: "A valid \"to\" date is required." }) }),
  })
  .refine((data) => data.to.getTime() >= data.from.getTime(), {
    message: "\"to\" must be on or after \"from\".",
    path: ["to"],
  });

export type ReconciliationPeriodQuery = z.infer<typeof reconciliationPeriodQuerySchema>;

const durationMs = z.number().min(0, "Duration can't be negative.");

export const submitClientFiguresSchema = z.object({
  regularDurationMs: durationMs,
  breakDurationMs: durationMs,
  overtimeDurationMs: durationMs,
});

export type SubmitClientFiguresInput = z.infer<typeof submitClientFiguresSchema>;

export const resolveReconciliationSchema = z.object({
  regularDurationMs: durationMs,
  breakDurationMs: durationMs,
  overtimeDurationMs: durationMs,
  reason: z
    .string()
    .trim()
    .min(1, "Document why this discrepancy was accepted or adjusted.")
    .max(1000, "Keep it under 1000 characters"),
});

export type ResolveReconciliationInput = z.infer<typeof resolveReconciliationSchema>;
