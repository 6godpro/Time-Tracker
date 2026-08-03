// The single source of truth for allowed job titles. Add new titles
// here — no database migration needed since jobTitle is stored as a
// plain string, just validated against this list on the backend and
// rendered as a dropdown on the frontend. Keep this in sync with
// frontend/src/constants/jobTitles.ts (duplicated since the two apps
// don't share a package).
export const JOB_TITLES = [
  "Cold Caller",
  "Customer Care Representative",
  "DevOps Engineer",
] as const;

export type JobTitle = (typeof JOB_TITLES)[number];