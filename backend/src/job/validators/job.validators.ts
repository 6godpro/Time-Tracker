import { z } from "zod";

const jobName = z.string().trim().min(1, "Job name is required").max(100);
const minimumWorkMinutes = z
  .number()
  .int("Minimum work minutes must be a whole number.")
  .min(1, "Minimum work minutes must be at least 1.")
  .max(24 * 60, "Minimum work minutes can't exceed 24 hours.");

export const createJobSchema = z.object({
  name: jobName,
  minimumWorkMinutes,
  breakIsPaidByDefault: z.boolean().default(false),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const updateJobSchema = z
  .object({
    name: jobName.optional(),
    minimumWorkMinutes: minimumWorkMinutes.optional(),
    breakIsPaidByDefault: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Provide at least one field to update." });

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export const setJobActiveSchema = z.object({
  isActive: z.boolean(),
});

export type SetJobActiveInput = z.infer<typeof setJobActiveSchema>;
