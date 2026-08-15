import { z } from "zod";

export const emptyBodySchema = z.object({}).strict().optional();

export const createShiftEditRequestSchema = z.object({
  proposedClockOut: z.coerce.date({ errorMap: () => ({ message: "Enter a valid date and time" }) }),
  reason: z
    .string()
    .trim()
    .min(1, "Let us know why this needs correcting")
    .max(500, "Keep it under 500 characters"),
});

export type CreateShiftEditRequestInput = z.infer<typeof createShiftEditRequestSchema>;
