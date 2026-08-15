import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import { StatusBadge } from "@/components/StatusBadge";
import { Select } from "@/components/Select";
import { ShiftChart } from "@/components/ShiftChart";
import {
  useAdminClients,
  useAdminJobs,
  useCreateReconciliation,
  useEmployeePayroll,
  useEmployees,
  useEmployeeShifts,
  useExportEmployeeShifts,
  usePayrollPayments,
  useRecordPayrollPayment,
  useResolveReconciliation,
  useSubmitClientFigures,
  useUpdateEmployeeBreakOverride,
  useUpdateEmployeeClient,
  useUpdateEmployeeJob,
  useUpdateEmployeeRate,
} from "@/hooks/useAdmin";
import { extractErrorMessage } from "@/api/client";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
} from "@/utils/format";
import type {
  DurationBreakdown,
  EmployeeSummary,
  PayrollReconciliation,
} from "@/types/admin";

function RateEditor({ employee }: { employee: EmployeeSummary }) {
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
        className="rounded-lg py-1 text-sm font-medium text-ink hover:text-brand"
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

function JobEditor({ employee }: { employee: EmployeeSummary }) {
  const { data: jobs } = useAdminJobs();
  const updateJob = useUpdateEmployeeJob();
  const [isEditing, setIsEditing] = useState(false);
  const [jobId, setJobId] = useState(employee.job.id);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setJobId(employee.job.id);
          setIsEditing(true);
        }}
        className="rounded-lg py-1 text-left text-sm font-medium text-ink hover:text-brand"
      >
        {employee.job.name}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-44">
        <Select
          value={jobId}
          onChange={setJobId}
          options={(jobs ?? []).map((job) => ({
            value: job.id,
            label: job.name,
          }))}
        />
      </div>
      <button
        type="button"
        disabled={updateJob.isPending}
        onClick={() =>
          updateJob.mutate(
            { employeeId: employee.id, jobId },
            { onSuccess: () => setIsEditing(false) },
          )
        }
        className="text-sm font-semibold text-brand hover:text-brand-dark disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="text-sm text-ink-soft hover:text-ink"
      >
        Cancel
      </button>
    </div>
  );
}

function BreakOverrideEditor({ employee }: { employee: EmployeeSummary }) {
  const updateOverride = useUpdateEmployeeBreakOverride();

  const label =
    employee.breakIsPaidOverride === null
      ? `Job default (${employee.breakIsPaid ? "paid" : "unpaid"})`
      : employee.breakIsPaidOverride
        ? "Paid (override)"
        : "Unpaid (override)";

  const next =
    employee.breakIsPaidOverride === null
      ? true
      : employee.breakIsPaidOverride === true
        ? false
        : null;

  return (
    <button
      type="button"
      disabled={updateOverride.isPending}
      onClick={() =>
        updateOverride.mutate({
          employeeId: employee.id,
          breakIsPaidOverride: next,
        })
      }
      className="rounded-lg py-1 text-left text-sm font-medium text-ink hover:text-brand disabled:opacity-50"
    >
      {label}
    </button>
  );
}

function ClientEditor({ employee }: { employee: EmployeeSummary }) {
  const { data: clients } = useAdminClients();
  const updateClient = useUpdateEmployeeClient();
  const [isEditing, setIsEditing] = useState(false);
  const [clientId, setClientId] = useState(employee.client?.id ?? "");

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setClientId(employee.client?.id ?? "");
          setIsEditing(true);
        }}
        className="rounded-lg py-1 text-left text-sm font-medium text-ink hover:text-brand"
      >
        {employee.client?.name ?? "No client assigned"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-44">
        <Select
          value={clientId}
          onChange={setClientId}
          options={(clients ?? []).map((client) => ({
            value: client.id,
            label: client.name,
          }))}
          placeholder="No client"
        />
      </div>
      <button
        type="button"
        disabled={updateClient.isPending}
        onClick={() =>
          updateClient.mutate(
            { employeeId: employee.id, clientId: clientId || null },
            { onSuccess: () => setIsEditing(false) },
          )
        }
        className="text-sm font-semibold text-brand hover:text-brand-dark disabled:opacity-50"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="text-sm text-ink-soft hover:text-ink"
      >
        Cancel
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

function msToHoursString(ms: number): string {
  return (ms / 3_600_000).toFixed(2);
}

function hoursStringToMs(value: string): number {
  const hours = Number(value);
  return Number.isFinite(hours) && hours >= 0
    ? Math.round(hours * 3_600_000)
    : 0;
}

function BreakdownRow({
  label,
  breakdown,
}: {
  label: string;
  breakdown: DurationBreakdown;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 text-xs">
      <p className="text-ink-soft">{label}</p>
      <p className="text-right font-mono-tab text-ink">
        {msToHoursString(breakdown.regularDurationMs)}h reg
      </p>
      <p className="text-right font-mono-tab text-ink">
        {msToHoursString(breakdown.breakDurationMs)}h break
      </p>
      <p className="text-right font-mono-tab text-ink">
        {msToHoursString(breakdown.overtimeDurationMs)}h OT
      </p>
    </div>
  );
}

function ClientFiguresForm({
  employeeId,
  reconciliation,
}: {
  employeeId: string;
  reconciliation: PayrollReconciliation;
}) {
  const [regular, setRegular] = useState(
    msToHoursString(reconciliation.system.regularDurationMs),
  );
  const [breakHours, setBreakHours] = useState(
    msToHoursString(reconciliation.system.breakDurationMs),
  );
  const [overtime, setOvertime] = useState(
    msToHoursString(reconciliation.system.overtimeDurationMs),
  );
  const submitFigures = useSubmitClientFigures();

  return (
    <div className="mt-4 rounded-xl border border-line bg-surface p-4">
      <p className="mb-3 text-xs font-medium text-ink">
        Enter the client's reported hours for this period, broken down the same
        way
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs text-ink-soft">
            Regular (hrs)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={regular}
            onChange={(event) => setRegular(event.target.value)}
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-soft">
            Break (hrs)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={breakHours}
            onChange={(event) => setBreakHours(event.target.value)}
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-soft">
            Overtime (hrs)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={overtime}
            onChange={(event) => setOvertime(event.target.value)}
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {submitFigures.isError ? (
        <p className="mt-2 rounded-lg bg-danger-bg px-2.5 py-2 text-xs text-danger">
          {extractErrorMessage(submitFigures.error)}
        </p>
      ) : null}

      <Button
        type="button"
        className="mt-3 px-3! py-1.5! text-xs"
        isLoading={submitFigures.isPending}
        onClick={() =>
          submitFigures.mutate({
            employeeId,
            reconciliationId: reconciliation.id,
            figures: {
              regularDurationMs: hoursStringToMs(regular),
              breakDurationMs: hoursStringToMs(breakHours),
              overtimeDurationMs: hoursStringToMs(overtime),
            },
          })
        }
      >
        Submit Client Figures
      </Button>
    </div>
  );
}

function ResolveReconciliationForm({
  employeeId,
  reconciliation,
}: {
  employeeId: string;
  reconciliation: PayrollReconciliation;
}) {
  const [regular, setRegular] = useState(
    msToHoursString(reconciliation.system.regularDurationMs),
  );
  const [breakHours, setBreakHours] = useState(
    msToHoursString(reconciliation.system.breakDurationMs),
  );
  const [overtime, setOvertime] = useState(
    msToHoursString(reconciliation.system.overtimeDurationMs),
  );
  const [reason, setReason] = useState("");
  const resolve = useResolveReconciliation();

  return (
    <div className="mt-4 rounded-xl bg-status-break-bg p-4">
      <p className="mb-3 text-xs font-medium text-status-break">
        This period is flagged — the client's figures don't match ours within
        tolerance. Document what actually applies before payroll can proceed.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs text-ink-soft">
            Resolved regular (hrs)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={regular}
            onChange={(event) => setRegular(event.target.value)}
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-soft">
            Resolved break (hrs)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={breakHours}
            onChange={(event) => setBreakHours(event.target.value)}
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-soft">
            Resolved overtime (hrs)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={overtime}
            onChange={(event) => setOvertime(event.target.value)}
            className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-ink-soft">Reason</label>
        <textarea
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why does this discrepancy exist, and why are these the correct figures?"
          className="w-full rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {resolve.isError ? (
        <p className="mt-2 rounded-lg bg-danger-bg px-2.5 py-2 text-xs text-danger">
          {extractErrorMessage(resolve.error)}
        </p>
      ) : null}

      <Button
        type="button"
        className="mt-3 px-3! py-1.5! text-xs"
        isLoading={resolve.isPending}
        disabled={!reason.trim()}
        onClick={() =>
          resolve.mutate({
            employeeId,
            reconciliationId: reconciliation.id,
            input: {
              regularDurationMs: hoursStringToMs(regular),
              breakDurationMs: hoursStringToMs(breakHours),
              overtimeDurationMs: hoursStringToMs(overtime),
              reason: reason.trim(),
            },
          })
        }
      >
        Resolve
      </Button>
    </div>
  );
}

function ReconciliationSection({
  employeeId,
  reconciliation,
  hasClient,
  range,
}: {
  employeeId: string;
  reconciliation: PayrollReconciliation | null;
  hasClient: boolean;
  range: { from: string; to: string };
}) {
  const createReconciliation = useCreateReconciliation();

  if (!hasClient) {
    return (
      <p className="mt-4 rounded-lg bg-status-idle-bg px-3 py-2 text-xs text-ink-soft">
        Assign this employee to a client above before reconciling and recording
        payroll for them.
      </p>
    );
  }

  if (!reconciliation) {
    return (
      <div className="mt-4">
        <p className="mb-2 text-xs text-ink-soft">
          This period hasn't been reconciled against the client's record yet.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="px-3! py-1.5! text-xs"
          isLoading={createReconciliation.isPending}
          onClick={() => createReconciliation.mutate({ employeeId, range })}
        >
          Start Reconciliation
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-ink">Reconciliation</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            reconciliation.status === "CLEAN" ||
            reconciliation.status === "RESOLVED"
              ? "bg-status-working-bg text-status-working"
              : reconciliation.status === "FLAGGED"
                ? "bg-status-break-bg text-status-break"
                : "bg-status-idle-bg text-ink-soft"
          }`}
        >
          {reconciliation.status}
        </span>
      </div>

      <BreakdownRow label="System" breakdown={reconciliation.system} />
      {reconciliation.client ? (
        <BreakdownRow label="Client" breakdown={reconciliation.client} />
      ) : null}
      {reconciliation.resolved ? (
        <BreakdownRow label="Resolved" breakdown={reconciliation.resolved} />
      ) : null}

      {reconciliation.status === "PENDING" ? (
        <ClientFiguresForm
          employeeId={employeeId}
          reconciliation={reconciliation}
        />
      ) : null}

      {reconciliation.status === "FLAGGED" ? (
        <ResolveReconciliationForm
          employeeId={employeeId}
          reconciliation={reconciliation}
        />
      ) : null}

      {reconciliation.status === "RESOLVED" &&
      reconciliation.resolutionReason ? (
        <p className="mt-3 rounded-lg bg-status-idle-bg px-3 py-2 text-xs text-ink-soft">
          <span className="font-medium text-ink">Resolution: </span>
          {reconciliation.resolutionReason}
        </p>
      ) : null}
    </div>
  );
}

function PayrollCard({
  employeeId,
  hasClient,
}: {
  employeeId: string;
  hasClient: boolean;
}) {
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
  const reconciliation = payroll?.reconciliation ?? null;
  const isReconciled =
    reconciliation?.status === "CLEAN" || reconciliation?.status === "RESOLVED";
  const canRecordPayment =
    isReconciled && !hasUnresolvedShifts && !alreadyRecordedForRange;

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
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-ink-soft">Regular</p>
              <p className="font-mono-tab text-lg font-semibold text-ink">
                {msToHoursString(payroll.system.regularDurationMs)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Overtime</p>
              <p className="font-mono-tab text-lg font-semibold text-ink">
                {msToHoursString(payroll.system.overtimeDurationMs)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Paid Break</p>
              <p className="font-mono-tab text-lg font-semibold text-ink">
                {msToHoursString(payroll.system.compensatedBreakDurationMs)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Est. Gross Pay</p>
              <p className="text-lg font-bold text-ink">
                {formatCurrency(payroll.estimatedGrossPayCents)}
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

          <ReconciliationSection
            employeeId={employeeId}
            reconciliation={reconciliation}
            hasClient={hasClient}
            range={{ from, to }}
          />

          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <Button
              variant="secondary"
              className="px-3! py-1.5! text-xs"
              isLoading={recordPayment.isPending}
              disabled={!canRecordPayment}
              onClick={() =>
                recordPayment.mutate({ employeeId, range: { from, to } })
              }
            >
              Record Payment
            </Button>
            {alreadyRecordedForRange ? (
              <p className="text-xs font-medium text-status-working">
                Payment recorded
              </p>
            ) : recordPayment.isError ? (
              <p className="text-xs font-medium text-danger">
                {extractErrorMessage(recordPayment.error)}
              </p>
            ) : !isReconciled ? (
              <p className="text-xs text-ink-soft">
                Reconcile this period before recording payment.
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
                <th className="pb-2 font-medium">Regular</th>
                <th className="pb-2 font-medium">Overtime</th>
                <th className="pb-2 font-medium">Paid Break</th>
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
                    {msToHoursString(payment.regularDurationMs)}
                  </td>
                  <td className="py-2.5 font-mono-tab text-ink-soft">
                    {msToHoursString(payment.overtimeDurationMs)}
                  </td>
                  <td className="py-2.5 font-mono-tab text-ink-soft">
                    {msToHoursString(payment.compensatedBreakDurationMs)}
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
                {employee.job.name} &middot; {employee.email}
              </p>
            </div>
            <StatusBadge status={employee.currentStatus} />
          </div>

          <Card className="mb-6">
            <h2 className="mb-4 text-sm font-semibold text-ink">
              Employee Info
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
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
              <div>
                <p className="text-xs text-ink-soft">Job</p>
                <JobEditor employee={employee} />
              </div>
              <div>
                <p className="text-xs text-ink-soft">Break Pay</p>
                <BreakOverrideEditor employee={employee} />
              </div>
              <div>
                <p className="text-xs text-ink-soft">Client</p>
                <ClientEditor employee={employee} />
              </div>
            </div>
          </Card>

          <ShiftsCard employeeId={employeeId} />
          <PayrollCard
            employeeId={employeeId}
            hasClient={Boolean(employee.client)}
          />
          <PaymentHistoryCard employeeId={employeeId} />
        </>
      )}
    </AppLayout>
  );
}
