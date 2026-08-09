import { FormEvent, useState } from "react";
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
  useExtendShift,
  usePendingCorrections,
} from "@/hooks/useShift";
import { useEndBreak, useStartBreak } from "@/hooks/useBreak";
import { useTick } from "@/hooks/useElapsedTime";
import { useAuthStore } from "@/store/authStore";
import { extractErrorMessage } from "@/api/client";
import { formatDate, formatDuration, formatFullDate, formatTime } from "@/utils/format";
import type { Shift } from "@/types/shift";

function elapsedMs(fromIso: string, now: Date): number {
  return now.getTime() - new Date(fromIso).getTime();
}

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
      description={`Closed automatically on ${formatDate(shift.clockIn)} after being open too long. Add the real clock-out time before clocking in again.${
        remaining > 0 ? ` (${remaining} more shift${remaining === 1 ? "" : "s"} after this one.)` : ""
      }`}
      showCloseButton={false}
    >
      <ShiftCorrectionForm shift={shift} />
    </Modal>
  );
}

function ExtendShiftPrompt({ shift }: { shift: Shift }) {
  const [isExtending, setIsExtending] = useState(false);
  const [note, setNote] = useState("");
  const extendShift = useExtendShift();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    extendShift.mutate(
      { note },
      {
        onSuccess: () => {
          setIsExtending(false);
          setNote("");
        },
      },
    );
  };

  return (
    <div className="mt-6 w-full rounded-xl bg-status-break-bg px-4 py-3 text-left text-xs text-status-break sm:max-w-xs">
      <p>
        You&apos;ve been clocked in for over 8 hours. This shift auto-closes at{" "}
        <span className="font-medium">{formatTime(shift.autoCloseAt)}</span> unless you extend it.
      </p>

      {isExtending ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
          <div>
            <label htmlFor="extend-note" className="mb-1 block font-medium text-ink">
              Why do you need more time?
            </label>
            <textarea
              id="extend-note"
              required
              rows={2}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Covering an extra shift tonight"
              className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {extendShift.isError ? (
            <p className="rounded-lg bg-danger-bg px-2.5 py-2 text-danger">
              {extractErrorMessage(extendShift.error)}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" className="px-3! py-2! text-xs" isLoading={extendShift.isPending}>
              Extend by 2 hours
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="px-3! py-2! text-xs"
              onClick={() => setIsExtending(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="mt-2 px-3! py-2! text-xs"
          onClick={() => setIsExtending(true)}
        >
          Extend shift
        </Button>
      )}
    </div>
  );
}

function ExtendedNotice({ shift }: { shift: Shift }) {
  return (
    <p className="mt-6 w-full rounded-xl bg-status-idle-bg px-4 py-3 text-left text-xs text-ink-soft sm:max-w-xs">
      Extended — this shift will auto-close at{" "}
      <span className="font-medium text-ink">{formatTime(shift.autoCloseAt)}</span> if you don&apos;t clock out
      first.
    </p>
  );
}

export function Dashboard() {
  useTick();
  const now = new Date();
  const user = useAuthStore((s) => s.user);

  const { data: shift, isLoading } = useCurrentShift();
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

  const workedMs = shift
    ? shift.status === "WORKING"
      ? elapsedMs(shift.clockIn, now) - shift.breakDurationMs
      : shift.workedDurationMs
    : 0;

  const liveBreakMs = shift
    ? shift.activeBreak
      ? shift.breakDurationMs +
        (now.getTime() - new Date(shift.activeBreak.startTime).getTime())
      : shift.breakDurationMs
    : 0;

  const canExtend = Boolean(
    shift &&
      !shift.extendedCutoffAt &&
      now.getTime() >= new Date(shift.extendWindowStartsAt).getTime() &&
      now.getTime() < new Date(shift.autoCloseAt).getTime(),
  );

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
              </div>
            ) : null}

            {shift ? (
              shift.extendedCutoffAt ? (
                <ExtendedNotice shift={shift} />
              ) : canExtend ? (
                <ExtendShiftPrompt shift={shift} />
              ) : null
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