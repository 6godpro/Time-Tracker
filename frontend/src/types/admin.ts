import type { Role } from "./auth";
import type { Shift, ShiftEditRequestStatus, ShiftStatus } from "./shift";

export interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  email: string;
  role: Role;
  createdAt: string;
  totalShifts: number;
  currentStatus: ShiftStatus | "NOT_WORKING";
}

export interface EmployeeShiftsResponse {
  employee: { id: string; firstName: string; lastName: string; fullName: string; jobTitle: string; email: string; role: Role };
  shifts: Shift[];
}

export interface AdminShiftEditRequest {
  id: string;
  status: ShiftEditRequestStatus;
  reason: string;
  proposedClockOut: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  requestedBy: { id: string; fullName: string; email: string };
  shift: { id: string; clockIn: string; clockOut: string | null; autoClosed: boolean; needsReview: boolean };
}