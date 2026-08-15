import type { Role } from "./auth";
import type { Shift, ShiftEditRequestStatus, ShiftStatus } from "./shift";

export interface EmployeeJobSummary {
  id: string;
  name: string;
  minimumWorkMinutes: number;
}

export interface EmployeeClientSummary {
  id: string;
  name: string;
}

export interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
  hourlyRateCents: number;
  job: EmployeeJobSummary;
  breakIsPaidOverride: boolean | null;
  breakIsPaid: boolean;
  client: EmployeeClientSummary | null;
  totalShifts: number;
  currentStatus: ShiftStatus | "NOT_WORKING";
}

export interface PayrollEmployee {
  id: string;
  fullName: string;
  email: string;
  hourlyRateCents: number;
}

export interface DurationBreakdown {
  regularDurationMs: number;
  breakDurationMs: number;
  overtimeDurationMs: number;
}

export type ReconciliationStatus = "PENDING" | "CLEAN" | "FLAGGED" | "RESOLVED";

export interface PayrollReconciliation {
  id: string;
  employeeId: string;
  periodFrom: string;
  periodTo: string;
  system: DurationBreakdown;
  client: DurationBreakdown | null;
  resolved: DurationBreakdown | null;
  status: ReconciliationStatus;
  resolutionReason: string | null;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeePayroll {
  employee: PayrollEmployee;
  from: string;
  to: string;
  shiftCount: number;
  unresolvedShiftCount: number;
  system: {
    regularDurationMs: number;
    overtimeDurationMs: number;
    compensatedBreakDurationMs: number;
  };
  estimatedGrossPayCents: number;
  reconciliation: PayrollReconciliation | null;
}

export interface PayrollRow {
  employee: PayrollEmployee;
  shiftCount: number;
  system: {
    regularDurationMs: number;
    overtimeDurationMs: number;
    compensatedBreakDurationMs: number;
  };
  estimatedGrossPayCents: number;
}

export interface PayrollSummary {
  from: string;
  to: string;
  rows: PayrollRow[];
  totalEstimatedGrossPayCents: number;
}

export interface PayrollPayment {
  id: string;
  periodFrom: string;
  periodTo: string;
  hourlyRateCents: number;
  regularDurationMs: number;
  overtimeDurationMs: number;
  compensatedBreakDurationMs: number;
  workedDurationMs: number;
  grossPayCents: number;
  reconciliationId: string | null;
  paidAt: string;
  createdAt: string;
}

export interface EmployeeShiftsResponse {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    role: Role;
    hourlyRateCents: number;
    currentJobId: string;
    currentJob: EmployeeJobSummary & { breakIsPaidByDefault: boolean };
    breakIsPaidOverride: boolean | null;
    clientId: string | null;
    client: EmployeeClientSummary | null;
  };
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
  shift: {
    id: string;
    clockIn: string;
    clockOut: string | null;
    autoClosed: boolean;
    needsReview: boolean;
  };
}
