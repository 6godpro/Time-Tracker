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
  hourlyRateCents: number;
  totalShifts: number;
  currentStatus: ShiftStatus | "NOT_WORKING";
}

export interface PayrollEmployee {
  id: string;
  fullName: string;
  email: string;
  hourlyRateCents: number;
}

export interface EmployeePayroll {
  employee: PayrollEmployee;
  from: string;
  to: string;
  shiftCount: number;
  workedDurationMs: number;
  grossPayCents: number;
  unresolvedShiftCount: number;
}

export interface PayrollRow {
  employee: PayrollEmployee;
  shiftCount: number;
  workedDurationMs: number;
  grossPayCents: number;
}

export interface PayrollSummary {
  from: string;
  to: string;
  rows: PayrollRow[];
  totalGrossPayCents: number;
}

export interface PayrollPayment {
  id: string;
  periodFrom: string;
  periodTo: string;
  hourlyRateCents: number;
  workedDurationMs: number;
  grossPayCents: number;
  paidAt: string;
  createdAt: string;
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