export type ShiftStatus = "WORKING" | "ON_BREAK" | "COMPLETED";

export type ShiftEditRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ShiftEditRequest {
  id: string;
  proposedClockOut: string;
  reason: string;
  status: ShiftEditRequestStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface BreakRecord {
  id: string;
  startTime: string;
  endTime: string | null;
}

export interface Shift {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  status: ShiftStatus;
  autoClosed: boolean;
  needsReview: boolean;
  autoCloseAt: string;
  extendWindowStartsAt: string;
  extendedCutoffAt: string | null;
  extensionNote: string | null;
  extendedAt: string | null;
  breakDurationMs: number;
  workedDurationMs: number;
  activeBreak: { id: string; startTime: string } | null;
  breaks: BreakRecord[];
  editRequests: ShiftEditRequest[];
}