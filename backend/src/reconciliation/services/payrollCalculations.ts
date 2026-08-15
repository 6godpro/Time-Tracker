import { env } from "../../config/env";

// Resolves whether a given employee's break time is compensated —
// User.breakIsPaidOverride wins when set, otherwise it falls back to
// the employee's current job's default. Deliberately reads the
// employee's CURRENT job/override rather than any historical snapshot:
// unlike Shift.minimumWorkMinutesAtClockIn (which governs a specific
// shift and must never change after the fact), break-pay eligibility is
// a payroll-only aggregate — see the schema comment on
// PayrollReconciliation — so it's always evaluated as of "now," the
// moment a reconciliation is computed.
export function resolveBreakIsPaid(
  user: { breakIsPaidOverride: boolean | null },
  job: { breakIsPaidByDefault: boolean } | null | undefined,
): boolean {
  return user.breakIsPaidOverride ?? job?.breakIsPaidByDefault ?? false;
}

function getWallClockDateParts(date: Date, timeZone: string): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

// Buckets a shift's clockIn into an ISO-style "business week" key
// (e.g. "2026-W33") based on env.businessTimeZone — the app's single
// organizational timezone (there's no per-employee or per-client
// timezone concept). Two clockIn instants that fall on the same
// wall-clock week in that timezone always map to the same key, which is
// what the weekly overtime threshold groups shifts by.
//
// This is a reasonable approximation, not a fully rigorous one: it
// anchors each date at UTC noon before doing ISO-week math, which
// avoids the date shifting by a day due to its own time-of-day
// component, but a shift whose clockIn falls extremely close to a DST
// transition in businessTimeZone could still be bucketed slightly
// differently than a calendar would show. Acceptable for weekly payroll
// bucketing; not intended as a general-purpose timezone library.
export function computeBusinessWeekKey(date: Date, timeZone: string = env.businessTimeZone): string {
  const { year, month, day } = getWallClockDateParts(date, timeZone);
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const dayNum = (anchor.getUTCDay() + 6) % 7; // 0 = Monday ... 6 = Sunday
  const thursday = new Date(anchor);
  thursday.setUTCDate(anchor.getUTCDate() - dayNum + 3);

  const isoYear = thursday.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNum + 3);

  const weekNumber =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return `${isoYear}-W${String(weekNumber).padStart(2, "0")}`;
}

export interface ShiftForOvertimeCalculation {
  clockIn: Date;
  // Excludes break time entirely, same meaning workedDurationMs always
  // has everywhere else in this app — see shift.service.ts.
  workedDurationMs: number;
  breakDurationMs: number;
  minimumWorkMinutesAtClockIn: number;
}

export interface WeeklyBreakdown {
  weekKey: string;
  workedMs: number;
  breakMs: number;
  thresholdMs: number;
  regularMs: number;
  overtimeMs: number;
}

// Splits a set of shifts (already scoped to one employee and one pay
// period) into regular vs. overtime per business week. Break time —
// paid or unpaid — is excluded from both sides of the threshold, since
// workedDurationMs never includes it in the first place; compensated
// break pay is added on top separately (see resolveBreakIsPaid) and
// never counts toward the overtime threshold.
//
// Weekly threshold = that week's daily minimum × 5 standard working
// days (5 is fixed, not configurable). If an employee's job changed
// mid-week, the week's threshold uses the LARGER of that week's
// shifts' minimumWorkMinutesAtClockIn values — a deliberate
// simplification rather than prorating the threshold day-by-day.
export function computeWeeklyBreakdowns(
  shifts: ShiftForOvertimeCalculation[],
  timeZone: string = env.businessTimeZone,
): WeeklyBreakdown[] {
  const byWeek = new Map<string, { workedMs: number; breakMs: number; maxMinimumWorkMinutes: number }>();

  for (const shift of shifts) {
    const weekKey = computeBusinessWeekKey(shift.clockIn, timeZone);
    const bucket = byWeek.get(weekKey) ?? { workedMs: 0, breakMs: 0, maxMinimumWorkMinutes: 0 };

    bucket.workedMs += shift.workedDurationMs;
    bucket.breakMs += shift.breakDurationMs;
    bucket.maxMinimumWorkMinutes = Math.max(bucket.maxMinimumWorkMinutes, shift.minimumWorkMinutesAtClockIn);

    byWeek.set(weekKey, bucket);
  }

  return Array.from(byWeek.entries())
    .map(([weekKey, bucket]) => {
      const thresholdMs = bucket.maxMinimumWorkMinutes * 60_000 * 5;
      const regularMs = Math.min(bucket.workedMs, thresholdMs);
      const overtimeMs = Math.max(bucket.workedMs - thresholdMs, 0);

      return { weekKey, workedMs: bucket.workedMs, breakMs: bucket.breakMs, thresholdMs, regularMs, overtimeMs };
    })
    .sort((a, b) => a.weekKey.localeCompare(b.weekKey));
}

export function sumWeeklyBreakdowns(
  breakdowns: WeeklyBreakdown[],
): { regularMs: number; overtimeMs: number; breakMs: number } {
  return breakdowns.reduce(
    (totals, breakdown) => ({
      regularMs: totals.regularMs + breakdown.regularMs,
      overtimeMs: totals.overtimeMs + breakdown.overtimeMs,
      breakMs: totals.breakMs + breakdown.breakMs,
    }),
    { regularMs: 0, overtimeMs: 0, breakMs: 0 },
  );
}
