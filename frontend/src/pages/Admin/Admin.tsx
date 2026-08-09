import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import { StatusBadge } from "@/components/StatusBadge";
import { useEmployees, useReviewShiftEditRequest, useShiftEditRequests } from "@/hooks/useAdmin";
import { extractErrorMessage } from "@/api/client";
import { formatDate, formatTime } from "@/utils/format";
import type { AdminShiftEditRequest, EmployeeSummary } from "@/types/admin";

const PAGE_SIZE = 10;

function PendingEditRequestRow({ request }: { request: AdminShiftEditRequest }) {
  const [reviewNote, setReviewNote] = useState("");
  const review = useReviewShiftEditRequest();

  const handleReview = (decision: "APPROVED" | "REJECTED") => {
    review.mutate({
      requestId: request.id,
      payload: { decision, reviewNote: reviewNote.trim() || undefined },
    });
  };

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">{request.requestedBy.fullName}</p>
          <p className="text-xs text-ink-soft">{request.requestedBy.email}</p>
        </div>
        <p className="shrink-0 text-xs text-ink-soft">Requested {formatDate(request.createdAt)}</p>
      </div>

      <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
        <div>
          <p className="text-ink-soft">Current shift record</p>
          <p className="font-medium text-ink">
            {formatDate(request.shift.clockIn)}, {formatTime(request.shift.clockIn)} &ndash;{" "}
            {request.shift.clockOut ? formatTime(request.shift.clockOut) : "—"}
          </p>
        </div>
        <div>
          <p className="text-ink-soft">Proposed clock-out</p>
          <p className="font-medium text-ink">
            {formatDate(request.proposedClockOut)}, {formatTime(request.proposedClockOut)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-ink-soft">
        <span className="font-medium text-ink">Employee&apos;s reason: </span>
        {request.reason}
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="Optional note (shown to the employee if rejected)"
          className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            className="px-3! py-2! text-xs"
            disabled={review.isPending}
            isLoading={review.isPending && review.variables?.payload.decision === "APPROVED"}
            onClick={() => handleReview("APPROVED")}
          >
            Approve
          </Button>
          <Button
            type="button"
            variant="danger"
            className="px-3! py-2! text-xs"
            disabled={review.isPending}
            isLoading={review.isPending && review.variables?.payload.decision === "REJECTED"}
            onClick={() => handleReview("REJECTED")}
          >
            Reject
          </Button>
        </div>
      </div>

      {review.isError ? (
        <p className="mt-2 rounded-lg bg-danger-bg px-2.5 py-2 text-xs text-danger">
          {extractErrorMessage(review.error)}
        </p>
      ) : null}
    </div>
  );
}

function EmployeeRow({ employee }: { employee: EmployeeSummary }) {
  return (
    <Link
      to="/admin/employees/$employeeId"
      params={{ employeeId: employee.id }}
      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 transition-colors hover:bg-surface"
    >
      <div>
        <p className="text-sm font-semibold text-ink">{employee.fullName}</p>
        <p className="text-xs text-ink-soft">{employee.jobTitle}</p>
      </div>
      <div className="hidden text-right sm:block">
        <StatusBadge status={employee.currentStatus} />
        <p className="mt-1 text-xs text-ink-soft">{employee.totalShifts} completed shifts</p>
      </div>
    </Link>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      <p className="text-xs text-ink-soft">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-3! py-1.5! text-xs"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="px-3! py-1.5! text-xs"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

export function Admin() {
  const { data: employees, isLoading } = useEmployees();
  const { data: pendingRequests, isLoading: isLoadingRequests } = useShiftEditRequests();
  const [page, setPage] = useState(1);

  const pageCount = employees ? Math.max(1, Math.ceil(employees.length / PAGE_SIZE)) : 1;
  const pageEmployees = employees
    ? employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : [];

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Employees</h1>
        <p className="mt-1 text-sm text-ink-soft">
          View shift activity, payroll, and employee records
        </p>
      </div>

      <Card className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Pending Shift Corrections</h2>
          {pendingRequests && pendingRequests.length > 0 ? (
            <span className="rounded-full bg-status-break-bg px-2.5 py-1 text-xs font-medium text-status-break">
              {pendingRequests.length} pending
            </span>
          ) : null}
        </div>

        {isLoadingRequests ? (
          <Loader label="Loading requests" />
        ) : !pendingRequests || pendingRequests.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-soft">No pending correction requests</p>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <PendingEditRequestRow key={request.id} request={request} />
            ))}
          </div>
        )}
      </Card>

      {isLoading ? (
        <Card>
          <Loader label="Loading employees" />
        </Card>
      ) : !employees || employees.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm font-medium text-ink">No employees yet</p>
        </Card>
      ) : (
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">All Employees</h2>
          <div className="space-y-2">
            {pageEmployees.map((employee) => (
              <EmployeeRow key={employee.id} employee={employee} />
            ))}
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </Card>
      )}
    </AppLayout>
  );
}
