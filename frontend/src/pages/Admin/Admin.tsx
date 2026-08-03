import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import { StatusBadge } from "@/components/StatusBadge";
import {
  useEmployees,
  useEmployeeShifts,
  useExportEmployeeShifts,
  useReviewShiftEditRequest,
  useShiftEditRequests,
} from "@/hooks/useAdmin";
import { extractErrorMessage } from "@/api/client";
import { formatDate, formatDuration, formatTime } from "@/utils/format";
import { ShiftChart } from "@/components/ShiftChart";
import type { AdminShiftEditRequest, EmployeeSummary } from "@/types/admin";

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

function EmployeeRow({
  employee,
  isSelected,
  onSelect,
  onExport,
  isExporting,
}: {
  employee: EmployeeSummary;
  isSelected: boolean;
  onSelect: () => void;
  onExport: () => void;
  isExporting: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
        isSelected
          ? "border-brand bg-status-idle-bg"
          : "border-line bg-card hover:bg-surface"
      }`}
    >
      <button
        onClick={onSelect}
        className="flex flex-1 items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-ink">{employee.fullName}</p>
          <p className="text-xs text-ink-soft">{employee.jobTitle}</p>
        </div>
        <div className="hidden text-right sm:block">
          <StatusBadge status={employee.currentStatus} />
          <p className="mt-1 text-xs text-ink-soft">
            {employee.totalShifts} completed shifts
          </p>
        </div>
      </button>
      <Button
        variant="secondary"
        onClick={onExport}
        isLoading={isExporting}
        className="shrink-0 px-3! py-2! text-xs"
      >
        Export
      </Button>
    </div>
  );
}

export function Admin() {
  const { data: employees, isLoading } = useEmployees();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: shiftsData, isLoading: isLoadingShifts } =
    useEmployeeShifts(selectedId);
  const exportShifts = useExportEmployeeShifts();
  const [viewMode, setViewMode] = useState<"list" | "chart">("chart");
  const { data: pendingRequests, isLoading: isLoadingRequests } = useShiftEditRequests();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">Employees</h1>
        <p className="mt-1 text-sm text-ink-soft">
          View shift activity and export individual employee records
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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2">
            {employees.map((employee) => (
              <EmployeeRow
                key={employee.id}
                employee={employee}
                isSelected={selectedId === employee.id}
                onSelect={() => setSelectedId(employee.id)}
                onExport={() =>
                  exportShifts.mutate({
                    employeeId: employee.id,
                    employeeName: employee.fullName,
                  })
                }
                isExporting={
                  exportShifts.isPending &&
                  exportShifts.variables?.employeeId === employee.id
                }
              />
            ))}
          </div>

          <Card>
            {!selectedId ? (
              <p className="py-8 text-center text-sm text-ink-soft">
                Select an employee to view their shifts
              </p>
            ) : isLoadingShifts ? (
              <Loader label="Loading shifts" />
            ) : !shiftsData || shiftsData.shifts.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-soft">
                No shifts recorded for this employee yet
              </p>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">
                    {shiftsData.employee.firstName}&apos;s Shifts
                  </h2>
                  <div className="flex gap-1 rounded-lg border border-line bg-surface p-0.5">
                    {(["chart", "list"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                          viewMode === mode
                            ? "bg-card text-ink shadow-sm"
                            : "text-ink-soft"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {viewMode === "chart" ? (
                  <ShiftChart shifts={shiftsData.shifts} />
                ) : (
                  <div className="space-y-3">
                    {shiftsData.shifts.map((shift) => (
                      <div
                        key={shift.id}
                        className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">
                            {formatDate(shift.clockIn)}
                          </p>
                          <p className="text-xs text-ink-soft">
                            {formatTime(shift.clockIn)} &ndash;{" "}
                            {shift.clockOut
                              ? formatTime(shift.clockOut)
                              : "In progress"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono-tab text-sm font-semibold text-ink">
                            {formatDuration(shift.workedDurationMs)}
                          </p>
                          <StatusBadge status={shift.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </AppLayout>
  );
}