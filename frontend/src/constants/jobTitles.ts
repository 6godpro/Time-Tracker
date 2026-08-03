// Mirrors backend/src/constants/jobTitles.ts. Add new titles to both
// files — the backend enforces this list on registration; this copy
// just drives the dropdown.
export const JOB_TITLES = [
  "Cold Caller",
  "Customer Care Representative",
  "DevOps Engineer",
] as const;

export type JobTitle = (typeof JOB_TITLES)[number];