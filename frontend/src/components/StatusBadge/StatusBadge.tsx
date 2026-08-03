import type { ShiftStatus } from "@/types/shift";

type DisplayStatus = ShiftStatus | "NOT_WORKING";

const statusMap: Record<DisplayStatus, { label: string; dot: string; text: string; bg: string }> = {
  NOT_WORKING: { label: "Not Working", dot: "bg-status-idle", text: "text-status-idle", bg: "bg-status-idle-bg" },
  WORKING: { label: "Working", dot: "bg-status-working", text: "text-status-working", bg: "bg-status-working-bg" },
  ON_BREAK: { label: "On Break", dot: "bg-status-break", text: "text-status-break", bg: "bg-status-break-bg" },
  COMPLETED: { label: "Not Working", dot: "bg-status-idle", text: "text-status-idle", bg: "bg-status-idle-bg" },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const config = statusMap[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${config.bg} ${config.text}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
