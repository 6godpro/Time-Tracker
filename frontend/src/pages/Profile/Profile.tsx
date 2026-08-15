import type { ReactNode } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { Card } from "@/components/Card";
import { Loader } from "@/components/Loader";
import { StatusBadge } from "@/components/StatusBadge";
import { useCurrentShift, useShiftHistory } from "@/hooks/useShift";
import { useAuthStore } from "@/store/authStore";
import { getInitials } from "@/utils/user";
import { formatDuration } from "@/utils/format";

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card className="text-center">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <div className="mt-2 font-mono-tab text-2xl font-semibold text-ink">
        {value}
      </div>
    </Card>
  );
}

export function Profile() {
  const user = useAuthStore((s) => s.user);
  const { data: shifts, isLoading: isLoadingHistory } = useShiftHistory();
  const { data: currentShift, isLoading: isLoadingCurrent } = useCurrentShift();

  if (!user) {
    return (
      <AppLayout>
        <Card>
          <Loader label="Loading profile" />
        </Card>
      </AppLayout>
    );
  }

  const totalShifts = shifts?.length ?? 0;
  const totalWorkedMs =
    shifts?.reduce((sum, shift) => sum + shift.workedDurationMs, 0) ?? 0;
  const status = currentShift?.status ?? "NOT_WORKING";

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          {user.fullName}
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Account details and activity at a glance
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-semibold text-white">
            {getInitials(user.firstName, user.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-ink">
              {user.fullName}
            </h2>
            <p className="truncate text-sm text-ink-soft">
              {user.clientName
                ? `${user.jobTitle} - ${user.clientName}`
                : user.jobTitle}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              user.role === "ADMIN"
                ? "bg-status-break-bg text-status-break"
                : "bg-status-idle-bg text-ink-soft"
            }`}
          >
            {user.role === "ADMIN" ? "Admin" : "Employee"}
          </span>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-around gap-4 border-t border-line pt-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">
              Email
            </p>
            <p className="mt-1 truncate text-sm font-medium text-ink">
              {user.email}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">
              Member Since
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {formatMemberSince(user.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-ink-soft">
              Current Rate
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {`$ ${user.hourlyRateCents.toFixed(2)}/hour`}
            </p>
          </div>
        </div>
      </Card>

      {isLoadingHistory || isLoadingCurrent ? (
        <Card>
          <Loader label="Loading activity" />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Completed Shifts" value={totalShifts} />
          <StatCard
            label="Total Hours Worked"
            value={formatDuration(totalWorkedMs).slice(0, 5)}
          />
          <div className="col-span-2 sm:col-span-1">
            <Card className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-xs uppercase tracking-wide text-ink-soft">
                Current Status
              </p>
              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
