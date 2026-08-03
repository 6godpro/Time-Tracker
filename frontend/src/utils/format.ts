export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((unit) => String(unit).padStart(2, "0")).join(":");
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function toDateTimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export interface DailyWorkedHours {
  dateKey: string;
  label: string;
  hours: number;
}

/**
 * Groups shifts by calendar day (using clockIn) and sums worked
 * duration into hours, sorted oldest to newest for a left-to-right
 * chart. An in-progress shift's snapshot worked time is included
 * as-is (it reflects the moment the data was fetched, not live time).
 */
export function aggregateWorkedHoursByDay(
  shifts: { clockIn: string; workedDurationMs: number }[]
): DailyWorkedHours[] {
  const totals = new Map<string, number>();

  for (const shift of shifts) {
    const date = new Date(shift.clockIn);
    const dateKey = date.toISOString().slice(0, 10);
    totals.set(dateKey, (totals.get(dateKey) ?? 0) + shift.workedDurationMs);
  }

  return Array.from(totals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, ms]) => ({
      dateKey,
      label: new Date(dateKey).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      hours: Math.round((ms / 3_600_000) * 100) / 100,
    }));
}
