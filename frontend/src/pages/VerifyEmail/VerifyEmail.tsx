import { Link, useSearch } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Loader } from "@/components/Loader";
import { useVerifyEmailQuery } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/api/client";

export function VerifyEmail() {
  const { token } = useSearch({ from: "/verify-email" });

  const verifyEmail = useVerifyEmailQuery(token);

  if (!token) {
    return (
      <AuthLayout title="Invalid verification link" subtitle="This link is missing its verification token">
        <p className="text-center text-sm text-ink-soft">
          Make sure you opened the exact link from your email, or{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            log in
          </Link>{" "}
          and we'll let you resend one.
        </p>
      </AuthLayout>
    );
  }

  if (verifyEmail.isSuccess) {
    return (
      <AuthLayout title="Email verified" subtitle="Your account is ready">
        <div className="space-y-4 text-center">
          <p className="rounded-lg bg-status-working-bg px-3 py-2 text-sm text-status-working">
            {verifyEmail.data.message}
          </p>
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

  if (verifyEmail.isError) {
    return (
      <AuthLayout title="Verification failed" subtitle="We couldn't verify your email">
        <div className="space-y-4 text-center">
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {extractErrorMessage(verifyEmail.error)}
          </p>
          <p className="text-sm text-ink-soft">
            The link may have expired or already been used.{" "}
            <Link to="/login" className="font-medium text-brand hover:underline">
              Log in
            </Link>{" "}
            and we'll let you resend a new one.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verifying your email" subtitle="This will just take a moment">
      <Loader label="Verifying..." />
    </AuthLayout>
  );
}