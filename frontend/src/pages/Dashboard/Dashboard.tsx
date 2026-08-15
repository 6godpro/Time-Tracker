import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import { StatusBadge } from "@/components/StatusBadge";
import { Modal } from "@/components/Modal";
import { ShiftCorrectionForm } from "@/components/ShiftCorrectionForm";
import {
  useClockIn,
  useClockOut,
  useCurrentShift,
  usePendingCorrections,
} from "@/hooks/useShift";
import { useEndBreak, useStartBreak } from "@/hooks/useBreak";
import { useTick } from "@/hooks/useElapsedTime";
import { useAuthStore } from "@/store/authStore";
import { extractErrorMessage } from "@/api/client";
import {
  formatDate,
  formatDuration,
  formatFullDate,
  formatTime,
} from "@/utils/format";

function PendingCorrectionGate() {
  const { data: pendingShifts } = usePendingCorrections();
  const shift = pendingShifts?.[0];

  if (!shift) {
    return null;
  }

  const remaining = pendingShifts.length - 1;

  return (
    <Modal
      open
      onOpenChange={() => {}}
      title="This shift needs a quick note"
      description={`Closed automatically on ${formatDate(shift.clockIn)} — every shift ends at your job's minimum hours unless you clock out first, so this just needs the real clock-out time before you can clock in again.${
        remaining > 0
          ? ` (${remaining} more shift${remaining === 1 ? "" : "s"} after this one.)`
          : ""
      }`}
      showCloseButton={false}
    >
      <ShiftCorrectionForm shift={shift} />
    </Modal>
  );
}

export function Dashboard() {
  useTick();
  const now = new Date();
  const user = useAuthStore((s) => s.user);

  const { data: shift, isLoading, dataUpdatedAt } = useCurrentShift();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = (mutateFn: () => Promise<unknown>) => {
    setActionError(null);
    mutateFn().catch((err) => setActionError(extractErrorMessage(err)));
  };

  const isBusy =
    clockIn.isPending ||
    clockOut.isPending ||
    startBreak.isPending ||
    endBreak.isPending;

  const greetingHour = now.getHours();
  const greeting =
    greetingHour < 12
      ? "Good morning"
      : greetingHour < 18
        ? "Good afternoon"
        : "Good evening";

  const status = shift?.status ?? "NOT_WORKING";

  const clientElapsedSinceFetchMs = shift ? Math.max(now.getTime() - dataUpdatedAt, 0) : 0;

  const workedMs = shift
    ? shift.status === "WORKING"
      ? shift.workedDurationMs + clientElapsedSinceFetchMs
      : shift.workedDurationMs
    : 0;

  const liveBreakMs = shift
    ? shift.activeBreak
      ? shift.breakDurationMs + clientElapsedSinceFetchMs
      : shift.breakDurationMs
    : 0;

  const liveBreakRemainingMs = shift
    ? Math.max(shift.breakAllowanceMs - liveBreakMs, 0)
    : 0;

  return (
    <AppLayout>
      <PendingCorrectionGate />

      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          {greeting}
          {user ? `, ${user.firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">{formatFullDate(now)}</p>
      </div>

      <Card>
        {isLoading ? (
          <Loader label="Loading your shift" />
        ) : (
          <div className="flex flex-col items-center py-4 text-center">
            <StatusBadge status={status} />

            <div className="mt-6 font-mono-tab text-5xl font-semibold text-ink sm:text-6xl">
              {formatDuration(workedMs)}
            </div>
            <p className="mt-1 text-xs uppercase tracking-wide text-ink-soft">
              Worked today
            </p>

            {shift ? (
              <div className="mt-6 grid w-full grid-cols-2 gap-4 border-t border-line pt-6 text-left sm:max-w-xs">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">
                    Clock In
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {formatTime(shift.clockIn)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-soft">
                    Break Time
                  </p>
                  <p className="mt-1 font-mono-tab text-sm font-medium text-ink">
                    {formatDuration(liveBreakMs)}
                  </p>
                </div>
              </div>
            ) : null}

            {shift?.activeBreak ? (
              <div className="mt-4 text-sm text-ink-soft">
                Break started at{" "}
                <span className="font-medium text-ink">
                  {formatTime(shift.activeBreak.startTime)}
                </span>
                <br />
                {liveBreakRemainingMs > 0 ? (
                  <>
                    <span className="font-medium text-ink">
                      {formatDuration(liveBreakRemainingMs)}
                    </span>{" "}
                    of your hour left — the shift resumes automatically once it
                    runs out.
                  </>
                ) : (
                  "Your hour is up — resuming any moment."
                )}
              </div>
            ) : null}

            {shift && shift.status !== "COMPLETED" ? (
              <p className="mt-4 w-full text-xs text-ink-soft sm:max-w-xs">
                This shift closes automatically at{" "}
                <span className="font-medium text-ink">
                  {formatTime(shift.autoCloseAt)}
                </span>{" "}
                unless you clock out first — if you're still working past that,
                add the real clock-out time on your next login.
              </p>
            ) : null}

            {actionError ? (
              <p className="mt-4 w-full rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
                {actionError}
              </p>
            ) : null}

            <div className="mt-8 flex w-full flex-col gap-3 sm:max-w-xs">
              {status === "NOT_WORKING" ? (
                <Button
                  onClick={() => runAction(() => clockIn.mutateAsync())}
                  isLoading={clockIn.isPending}
                  disabled={isBusy}
                >
                  Clock In
                </Button>
              ) : null}

              {status === "WORKING" ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => runAction(() => startBreak.mutateAsync())}
                    isLoading={startBreak.isPending}
                    disabled={isBusy}
                  >
                    Start Break
                  </Button>
                  <Button
                    onClick={() => runAction(() => clockOut.mutateAsync())}
                    isLoading={clockOut.isPending}
                    disabled={isBusy}
                  >
                    Clock Out
                  </Button>
                </>
              ) : null}

              {status === "ON_BREAK" ? (
                <Button
                  onClick={() => runAction(() => endBreak.mutateAsync())}
                  isLoading={endBreak.isPending}
                  disabled={isBusy}
                >
                  End Break
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
