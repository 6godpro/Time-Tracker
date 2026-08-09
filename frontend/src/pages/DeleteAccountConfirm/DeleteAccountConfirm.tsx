import { Link, useSearch } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/Button";
import { useConfirmAccountDeletion } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/api/client";

export function DeleteAccountConfirm() {
  // Typed against the route's own validateSearch (see routes/delete-account.tsx),
  // so `token` is `string | undefined` without importing the Route object
  // directly and risking a page <-> route circular import.
  const { token } = useSearch({ from: "/delete-account" });

  const confirmDeletion = useConfirmAccountDeletion();

  // No token in the URL at all — someone navigated here directly rather
  // than through the emailed link. Nothing to confirm, so show a dead end
  // instead of a button that can only ever fail.
  if (!token) {
    return (
      <AuthLayout title="Invalid deletion link" subtitle="This link is missing its confirmation token">
        <p className="text-center text-sm text-ink-soft">
          Make sure you opened the exact link from your email, or{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            log in
          </Link>{" "}
          and request a new one from Settings.
        </p>
      </AuthLayout>
    );
  }

  if (confirmDeletion.isSuccess) {
    return (
      <AuthLayout title="Account deleted" subtitle="Your account has been permanently removed">
        <div className="space-y-4 text-center">
          <p className="rounded-lg bg-status-working-bg px-3 py-2 text-sm text-status-working">
            {confirmDeletion.data.message}
          </p>
          {/*
            Deliberately a styled Link, not a Button inside a Link — a
            <button> nested inside an <a> (which Link renders) is invalid
            HTML (interactive content inside interactive content).
          */}
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Go to Log In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Deliberately requires an explicit click rather than firing the moment
  // this page loads (the way email verification does) — this link can be
  // auto-visited by email clients' link-scanning/malware-scanning bots
  // before a human ever sees it, and unlike verification, deletion isn't
  // reversible, so nothing should happen here without a real button press.
  return (
    <AuthLayout title="Delete your account" subtitle="This permanently removes your account and all of your history">
      <div className="space-y-4">
        <p className="text-center text-sm text-ink-soft">
          This can't be undone. Confirming will permanently delete your account, along with all of your shift,
          break, and payroll history.
        </p>

        {confirmDeletion.isError ? (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {extractErrorMessage(confirmDeletion.error)}
          </p>
        ) : null}

        <Button
          type="button"
          variant="danger"
          className="w-full"
          isLoading={confirmDeletion.isPending}
          onClick={() => confirmDeletion.mutate({ token })}
        >
          Permanently Delete My Account
        </Button>
      </div>
    </AuthLayout>
  );
}