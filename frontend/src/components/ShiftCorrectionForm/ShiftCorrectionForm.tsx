import { FormEvent, useState } from "react";
import { Button } from "@/components/Button";
import { useCreateShiftEditRequest } from "@/hooks/useShift";
import { extractErrorMessage } from "@/api/client";
import { toDateTimeLocalValue } from "@/utils/format";
import type { Shift } from "@/types/shift";

interface ShiftCorrectionFormProps {
  shift: Shift;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ShiftCorrectionForm({ shift, onSuccess, onCancel }: ShiftCorrectionFormProps) {
  const [proposedClockOut, setProposedClockOut] = useState(() =>
    toDateTimeLocalValue(shift.clockOut ?? shift.clockIn),
  );
  const [reason, setReason] = useState("");
  const createRequest = useCreateShiftEditRequest();

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
          setReason("");
          onSuccess?.();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div>
        <label htmlFor={`clockOut-${shift.id}`} className="mb-1 block text-xs font-medium text-ink">
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
        <label htmlFor={`reason-${shift.id}`} className="mb-1 block text-xs font-medium text-ink">
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
        <p className="rounded-lg bg-danger-bg px-2.5 py-2 text-xs text-danger">
          {extractErrorMessage(createRequest.error)}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" className="px-3! py-2! text-xs" isLoading={createRequest.isPending}>
          Submit for review
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" className="px-3! py-2! text-xs" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}