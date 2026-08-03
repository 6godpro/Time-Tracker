import { FormEvent, useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Loader } from "@/components/Loader";
import { useCreateShiftEditRequest, useShiftHistory } from "@/hooks/useShift";
import { extractErrorMessage } from "@/api/client";
import { formatDate, formatDuration, formatTime, toDateTimeLocalValue } from "@/utils/format";
import type { Shift } from "@/types/shift";

function ShiftReviewNotice({ shift }: { shift: Shift }) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [proposedClockOut, setProposedClockOut] = useState(() => toDateTimeLocalValue(shift.clockOut ?? shift.clockIn));
  const [reason, setReason] = useState("");
  const createRequest = useCreateShiftEditRequest();

  const latestRequest = shift.editRequests[0] ?? null;

  if (latestRequest?.status === "PENDING") {
    return (
      <div className="mt-3 rounded-xl bg-status-break-bg px-3 py-2 text-xs text-status-break">
        This shift was closed automatically after being open too long. Your correction request is
        waiting on admin review.
      </div>
    );
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createRequest.mutate(
      {
        shiftId: shift.id,
        payload: {
          proposedClockOut: new Date(proposedClockOut).toISOString(),
          reason,
        },
      },
      {
        onSuccess: () => {
          setIsRequesting(false);
          setReason("");
        },
      },
    );
  };

  return (
    <div className="mt-3 rounded-xl bg-status-break-bg px-3 py-3 text-xs text-status-break">
      <p>This shift was closed automatically after being open too long — the clock-out time above isn't real.</p>

      {latestRequest?.status === "REJECTED" ? (
        <p className="mt-2 rounded-lg bg-card px-2.5 py-2 text-ink-soft">
          Your last request was rejected{latestRequest.reviewNote ? `: "${latestRequest.reviewNote}"` : "."} You
          can submit another one below.
        </p>
      ) : null}

      {isRequesting ? (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
          <div>
            <label htmlFor={`clockOut-${shift.id}`} className="mb-1 block font-medium text-ink">
              Actual clock-out time
            </label>
            <input
              id={`clockOut-${shift.id}`}
              type="datetime-local"
              required
              value={proposedClockOut}
              min={toDateTimeLocalValue(shift.clockIn)}
              max={toDateTimeLocalValue(new Date().toISOString())}
              onChange={(event) => setProposedClockOut(event.target.value)}
              className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label htmlFor={`reason-${shift.id}`} className="mb-1 block font-medium text-ink">
              Why does this need correcting?
            </label>
            <textarea
              id={`reason-${shift.id}`}
              required
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. I actually left around 6pm but forgot to clock out"
              className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {createRequest.isError ? (
            <p className="rounded-lg bg-red-50 px-2.5 py-2 text-red-600">
              {extractErrorMessage(createRequest.error)}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" className="px-3! py-2! text-xs" isLoading={createRequest.isPending}>
              Submit for review
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="px-3! py-2! text-xs"
              onClick={() => setIsRequesting(false)}
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
          onClick={() => setIsRequesting(true)}
        >
          Request correction
        </Button>
      )}
    </div>
  );
}

export function History() {
  const { data: shifts, isLoading } = useShiftHistory();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">History</h1>
        <p className="mt-1 text-sm text-ink-soft">Your completed shifts, newest first</p>
      </div>

      {isLoading ? (
        <Card>
          <Loader label="Loading history" />
        </Card>
      ) : !shifts || shifts.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm font-medium text-ink">No shifts yet</p>
          <p className="mt-1 text-sm text-ink-soft">Clock in from your dashboard to start your first shift.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shifts.map((shift) => (
            <Card key={shift.id} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{formatDate(shift.clockIn)}</p>
                    {shift.autoClosed ? (
                      <span className="rounded-full bg-status-break-bg px-2 py-0.5 text-[11px] font-medium text-status-break">
                        Auto-closed
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {formatTime(shift.clockIn)} &ndash; {shift.clockOut ? formatTime(shift.clockOut) : "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono-tab text-lg font-semibold text-ink">{formatDuration(shift.workedDurationMs)}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {shift.breakDurationMs > 0 ? `${formatDuration(shift.breakDurationMs)} break` : "No breaks"}
                  </p>
                </div>
              </div>

              {shift.needsReview ? <ShiftReviewNotice shift={shift} /> : null}
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}