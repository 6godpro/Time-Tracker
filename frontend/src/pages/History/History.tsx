import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { Loader } from "@/components/Loader";
import { ShiftCorrectionForm } from "@/components/ShiftCorrectionForm";
import { useShiftHistory } from "@/hooks/useShift";
import { useMyPayrollPayment, useMyPayrollPayments } from "@/hooks/usePayroll";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatTime,
} from "@/utils/format";
import type { Shift } from "@/types/shift";
import type { PayrollPayment } from "@/types/admin";

function ShiftReviewNotice({ shift }: { shift: Shift }) {
  const [isRequesting, setIsRequesting] = useState(false);

  const latestRequest = shift.editRequests[0] ?? null;

  if (latestRequest?.status === "PENDING") {
    return (
      <div className="mt-3 rounded-xl bg-status-break-bg px-3 py-2 text-xs text-status-break">
        This shift was closed automatically after being open too long. Your
        correction request is waiting on admin review.
      </div>
    );
  }

  if (latestRequest?.status === "APPROVED") {
    return (
      <div className="mt-3 rounded-xl bg-status-working-bg px-3 py-2 text-xs text-status-working">
        Your shift correction request was approved
        {latestRequest.reviewNote ? `: "${latestRequest.reviewNote}"` : "."} The
        clock-out time above reflects the correction.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-status-break-bg px-3 py-3 text-xs text-status-break">
      <p>
        This shift was closed automatically after being open too long — the
        clock-out time above isn't real.
      </p>

      {latestRequest?.status === "REJECTED" ? (
        <p className="mt-2 rounded-lg bg-card px-2.5 py-2 text-ink-soft">
          Your last request was rejected
          {latestRequest.reviewNote
            ? `: "${latestRequest.reviewNote}"`
            : "."}{" "}
          You can submit another one below.
        </p>
      ) : null}

      {isRequesting ? (
        <div className="mt-3">
          <ShiftCorrectionForm
            shift={shift}
            onSuccess={() => setIsRequesting(false)}
            onCancel={() => setIsRequesting(false)}
          />
        </div>
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

const SHIFTS_PAGE_SIZE = 10;

function ShiftHistoryList({
  highlightRequestId,
}: {
  highlightRequestId: string | null;
}) {
  const { data: shifts, isLoading } = useShiftHistory();
  const [page, setPage] = useState(1);

  if (isLoading) {
    return (
      <Card>
        <Loader label="Loading history" />
      </Card>
    );
  }

  if (!shifts || shifts.length === 0) {
    return (
      <Card className="text-center">
        <p className="text-sm font-medium text-ink">No shifts yet</p>
        <p className="mt-1 text-sm text-ink-soft">
          Clock in from your dashboard to start your first shift.
        </p>
      </Card>
    );
  }

  const pageCount = Math.max(1, Math.ceil(shifts.length / SHIFTS_PAGE_SIZE));
  const pageShifts = shifts.slice(
    (page - 1) * SHIFTS_PAGE_SIZE,
    page * SHIFTS_PAGE_SIZE,
  );
  const highlightedShiftId = highlightRequestId
    ? (shifts.find((shift) =>
        shift.editRequests.some((request) => request.id === highlightRequestId),
      )?.id ?? null)
    : null;

  return (
    <div>
      <div className="space-y-3">
        {pageShifts.map((shift) => (
          <Card key={shift.id} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {formatDate(shift.clockIn)}
                  </p>
                  {shift.autoClosed ? (
                    <span className="rounded-full bg-status-break-bg px-2 py-0.5 text-[11px] font-medium text-status-break">
                      Auto-closed
                    </span>
                  ) : null}
                  {shift.extendedCutoffAt ? (
                    <span className="rounded-full bg-status-idle-bg px-2 py-0.5 text-[11px] font-medium text-ink-soft">
                      Extended
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {formatTime(shift.clockIn)} &ndash;{" "}
                  {shift.clockOut ? formatTime(shift.clockOut) : "—"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono-tab text-lg font-semibold text-ink">
                  {formatDuration(shift.workedDurationMs)}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {shift.breakDurationMs > 0
                    ? `${formatDuration(shift.breakDurationMs)} break`
                    : "No breaks"}
                </p>
              </div>
            </div>

            {shift.needsReview ||
            (shift.id === highlightedShiftId &&
              shift.editRequests[0]?.status === "APPROVED") ? (
              <ShiftReviewNotice shift={shift} />
            ) : null}
          </Card>
        ))}
      </div>

      {pageCount > 1 ? (
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
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-3! py-1.5! text-xs"
              disabled={page >= pageCount}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 1 }, (_, i) => String(CURRENT_YEAR - i));
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthIndex(monthName: string): number {
  return MONTHS.indexOf(monthName) + 1;
}

interface PaymentRowType {
  payment: PayrollPayment;
  highlighted: boolean;
}

function PaymentRow({ payment, highlighted }: PaymentRowType) {
  return (
    <Card className={`p-5 ${highlighted ? "ring-2 ring-brand" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">
            {formatDate(payment.periodFrom)} &ndash;{" "}
            {formatDate(payment.periodTo)}
          </p>
          <p className="mt-0.5 text-sm text-ink-soft">
            Paid {formatDate(payment.paidAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-ink">
            {formatCurrency(payment.grossPayCents)}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {(payment.workedDurationMs / 3_600_000).toFixed(2)} hrs @{" "}
            {formatCurrency(payment.hourlyRateCents)}/hr
          </p>
        </div>
      </div>
    </Card>
  );
}

function PayrollHistorySection({ paymentId }: { paymentId: string | null }) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [appliedFilter, setAppliedFilter] = useState<{
    year: number;
    month: number;
  } | null>(null);

  const { data: linkedPayment, isLoading: isLoadingLinkedPayment } =
    useMyPayrollPayment(paymentId);
  const { data: payments, isLoading } = useMyPayrollPayments(appliedFilter);

  const canView = year !== "" && month !== "";

  return (
    <div className="space-y-4">
      {paymentId ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Payment details</p>
          {isLoadingLinkedPayment ? (
            <Card>
              <Loader label="Loading payment" />
            </Card>
          ) : linkedPayment ? (
            <PaymentRow payment={linkedPayment} highlighted />
          ) : (
            <Card className="text-center">
              <p className="text-sm font-medium text-ink">Payment not found</p>
            </Card>
          )}
        </div>
      ) : null}

      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-36">
            <p className="mb-1.5 text-xs font-medium text-ink-soft">Year</p>
            <Select
              value={year}
              onChange={setYear}
              options={YEARS}
              placeholder="Year"
            />
          </div>
          <div className="w-44">
            <p className="mb-1.5 text-xs font-medium text-ink-soft">Month</p>
            <Select
              value={month}
              onChange={setMonth}
              options={MONTHS}
              placeholder="Month"
            />
          </div>
          <Button
            type="button"
            disabled={!canView}
            onClick={() =>
              setAppliedFilter({ year: Number(year), month: monthIndex(month) })
            }
          >
            View
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <Loader label="Loading payroll history" />
        </Card>
      ) : appliedFilter === null ? (
        <Card className="text-center">
          <p className="text-sm font-medium text-ink">
            Select a year and month, then click View
          </p>
        </Card>
      ) : !payments || payments.length === 0 ? (
        <Card className="text-center">
          <p className="text-sm font-medium text-ink">
            No payments for that period
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              highlighted={payment.id === paymentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function History() {
  const search = useSearch({ from: "/_authenticated/history" });
  const navigate = useNavigate();

  const tab = search.tab ?? "shifts";

  const setTab = (nextTab: "shifts" | "payroll") => {
    navigate({
      to: "/history",
      search: {
        tab: nextTab,
        paymentId: nextTab === "payroll" ? search.paymentId : undefined,
      },
      replace: true,
    });
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">History</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {tab === "shifts"
              ? "Your completed shifts, newest first"
              : "Your recorded payments"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={tab === "shifts" ? "primary" : "secondary"}
            className="px-4! py-2! text-xs"
            onClick={() => setTab("shifts")}
          >
            Shift History
          </Button>
          <Button
            type="button"
            variant={tab === "payroll" ? "primary" : "secondary"}
            className="px-4! py-2! text-xs"
            onClick={() => setTab("payroll")}
          >
            Payroll History
          </Button>
        </div>
      </div>

      {tab === "payroll" ? (
        <PayrollHistorySection paymentId={search.paymentId ?? null} />
      ) : (
        <ShiftHistoryList
          highlightRequestId={search.shiftEditRequestId ?? null}
        />
      )}
    </AppLayout>
  );
}
