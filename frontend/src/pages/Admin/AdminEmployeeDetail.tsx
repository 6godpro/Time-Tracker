import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import { StatusBadge } from "@/components/StatusBadge";
import { ShiftChart } from "@/components/ShiftChart";
import {
  useEmployeePayroll,
  useEmployees,
  useEmployeeShifts,
  useExportEmployeeShifts,
  usePayrollPayments,
  useRecordPayrollPayment,
  useUpdateEmployeeRate,
} from "@/hooks/useAdmin";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
} from "@/utils/format";
import type { EmployeeSummary } from "@/types/admin";
import { extractErrorMessage } from "@/api/client";

export function RateEditor({ employee }: { employee: EmployeeSummary }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(
    (employee.hourlyRateCents / 100).toFixed(2),
  );
  const updateRate = useUpdateEmployeeRate();

  const handleSave = () => {
    const dollars = Number(value);
    if (Number.isNaN(dollars) || dollars < 0) {
      return;
    }
    updateRate.mutate(
      { employeeId: employee.id, hourlyRateCents: Math.round(dollars * 100) },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue((employee.hourlyRateCents / 100).toFixed(2));
          setIsEditing(true);
        }}
        className="rounded-lg py-1 text-sm font-medium text-ink hover:bg-surface hover:text-brand"
      >
        {formatCurrency(employee.hourlyRateCents)}/hr
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-ink-soft">$</span>
      <input
        type="number"
        min="0"
        step="0.01"
        autoFocus
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") handleSave();
          if (event.key === "Escape") setIsEditing(false);
        }}
        className="w-20 rounded-lg border border-line bg-surface px-1.5 py-1 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={updateRate.isPending}
        className="text-sm font-semibold text-brand hover:text-brand-dark disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}

function ShiftsCard({ employeeId }: { employeeId: string }) {
  const { data: shiftsData, isLoading } = useEmployeeShifts(employeeId);
  const exportShifts = useExportEmployeeShifts();
  const [viewMode, setViewMode] = useState<"chart" | "list">("chart");

  return (
    <Card className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Shifts</h2>
        <div className="flex items-center gap-2">
          {shiftsData && shiftsData.shifts.length > 0 ? (
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
          ) : null}
          <Button
            variant="secondary"
            className="px-3! py-1.5! text-xs"
            isLoading={exportShifts.isPending}
            onClick={() =>
              shiftsData &&
              exportShifts.mutate({
                employeeId,
                employeeName: shiftsData.employee.fullName,
              })
            }
          >
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Loader label="Loading shifts" />
      ) : !shiftsData || shiftsData.shifts.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-soft">
          No shifts recorded for this employee yet
        </p>
      ) : viewMode === "chart" ? (
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
                  {shift.clockOut ? formatTime(shift.clockOut) : "In progress"}
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
    </Card>
  );
}

function PayrollCard({ employeeId }: { employeeId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultFrom = new Date(Date.now() - 13 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(today);
  const { data: payroll, isLoading } = useEmployeePayroll(employeeId, {
    from,
    to,
  });
  const recordPayment = useRecordPayrollPayment();
  const alreadyRecordedForRange =
    recordPayment.isSuccess &&
    recordPayment.variables?.range.from === from &&
    recordPayment.variables?.range.to === to;

  const hasUnresolvedShifts = !!payroll && payroll.unresolvedShiftCount > 0;

  return (
    <Card className="mb-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Payroll</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(event) => {
              setFrom(event.target.value);
              recordPayment.reset();
            }}
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <span className="text-xs text-ink-soft">to</span>
          <input
            type="date"
            value={to}
            min={from}
            max={today}
            onChange={(event) => {
              setTo(event.target.value);
              recordPayment.reset();
            }}
            className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {isLoading ? (
        <Loader label="Calculating payroll" />
      ) : !payroll ? (
        <p className="py-4 text-center text-sm text-ink-soft">
          Unable to calculate payroll for this range
        </p>
      ) : (
        <div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-ink-soft">Hours Worked</p>
              <p className="font-mono-tab text-lg font-semibold text-ink">
                {(payroll.workedDurationMs / 3_600_000).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Rate</p>
              <p className="text-lg font-semibold text-ink">
                {formatCurrency(payroll.employee.hourlyRateCents)}/hr
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Gross Pay</p>
              <p className="text-lg font-bold text-ink">
                {formatCurrency(payroll.grossPayCents)}
              </p>
            </div>
          </div>

          {hasUnresolvedShifts ? (
            <p className="mt-4 rounded-lg bg-status-break-bg px-3 py-2 text-xs text-status-break">
              {payroll.unresolvedShiftCount} shift
              {payroll.unresolvedShiftCount === 1 ? "" : "s"} in this period{" "}
              {payroll.unresolvedShiftCount === 1 ? "is" : "are"} still awaiting
              a correction request review. Resolve{" "}
              {payroll.unresolvedShiftCount === 1 ? "it" : "them"} under Pending
              Shift Corrections before recording this payment.
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="primary"
              className="px-3! py-1.5! text-xs"
              isLoading={recordPayment.isPending}
              disabled={alreadyRecordedForRange || hasUnresolvedShifts}
              onClick={() =>
                recordPayment.mutate({ employeeId, range: { from, to } })
              }
            >
              Create a record
            </Button>
            {alreadyRecordedForRange ? (
              <p className="text-xs font-medium text-status-working">
                Payment recorded
              </p>
            ) : recordPayment.isError ? (
              <p className="text-xs font-medium text-danger">
                {extractErrorMessage(recordPayment.error)}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  );
}

function PaymentHistoryCard({ employeeId }: { employeeId: string }) {
  const { data: payments, isLoading } = usePayrollPayments(employeeId);

  return (
    <Card>
      <h2 className="mb-4 text-sm font-semibold text-ink">Payment History</h2>

      {isLoading ? (
        <Loader label="Loading payment history" />
      ) : !payments || payments.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-soft">
          No payments recorded yet
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-soft">
                <th className="pb-2 font-medium">Period</th>
                <th className="pb-2 font-medium">Hours</th>
                <th className="pb-2 font-medium">Rate</th>
                <th className="pb-2 font-medium">Paid</th>
                <th className="pb-2 text-right font-medium">Gross Pay</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-line last:border-0"
                >
                  <td className="py-2.5 font-medium text-ink">
                    {formatDate(payment.periodFrom)} &ndash;{" "}
                    {formatDate(payment.periodTo)}
                  </td>
                  <td className="py-2.5 font-mono-tab text-ink-soft">
                    {(payment.workedDurationMs / 3_600_000).toFixed(2)}
                  </td>
                  <td className="py-2.5 text-ink-soft">
                    {formatCurrency(payment.hourlyRateCents)}/hr
                  </td>
                  <td className="py-2.5 text-ink-soft">
                    {formatDate(payment.paidAt)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-ink">
                    {formatCurrency(payment.grossPayCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

export function AdminEmployeeDetail({ employeeId }: { employeeId: string }) {
  const { data: employees, isLoading } = useEmployees();
  const employee =
    employees?.find((candidate) => candidate.id === employeeId) ?? null;

  return (
    <AppLayout>
      <div className="mb-6">
        <Link
          to="/admin"
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          &larr; Back to Employees
        </Link>
      </div>

      {isLoading ? (
        <Card>
          <Loader label="Loading employee" />
        </Card>
      ) : !employee ? (
        <Card className="text-center">
          <p className="text-sm font-medium text-ink">Employee not found</p>
        </Card>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">
                {employee.fullName}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">
                {employee.jobTitle} &middot; {employee.email}
              </p>
            </div>
            <StatusBadge status={employee.currentStatus} />
          </div>

          <Card className="mb-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">
              Employee Info
            </h2>
            <div className="gap-4 grid grid-cols-1 sm:grid sm:grid-cols-3">
              <div>
                <p className="text-xs text-ink-soft">Role</p>
                <p className="text-sm font-medium capitalize text-ink">
                  {employee.role.toLowerCase()}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-soft">Completed Shifts</p>
                <p className="text-sm font-medium text-ink">
                  {employee.totalShifts}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-soft">Hourly Rate</p>
                <RateEditor employee={employee} />
              </div>
            </div>
          </Card>

          <ShiftsCard employeeId={employeeId} />
          <PayrollCard employeeId={employeeId} />
          <PaymentHistoryCard employeeId={employeeId} />
        </>
      )}
    </AppLayout>
  );
}
