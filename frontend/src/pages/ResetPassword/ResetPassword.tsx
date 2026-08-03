import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearch } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/Button";
import { useResetPassword } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/api/client";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export function ResetPassword() {
  const { token } = useSearch({ from: "/reset-password" });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const resetPassword = useResetPassword();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!token) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="This link is missing its reset token"
      >
        <p className="text-center text-sm text-ink-soft">
          Make sure you opened the exact link from your email, or{" "}
          <Link
            to="/forgot-password"
            className="font-medium text-brand hover:underline"
          >
            request a new one
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  const onSubmit = (values: ResetPasswordForm) => {
    resetPassword.mutate(
      { token, ...values },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
        },
      },
    );
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter and confirm your new password"
    >
      {successMessage ? (
        <div className="space-y-4 text-center">
          <p className="rounded-lg bg-status-working-bg px-3 py-2 text-sm text-status-working">
            {successMessage}
          </p>
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Go to Log In
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              {...register("newPassword")}
              placeholder="New Password"
            />
            {errors.newPassword ? (
              <p className="mt-1 text-xs text-danger">
                {errors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div>
            <input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              {...register("confirmNewPassword")}
              placeholder="Confirm New Password"
            />
            {errors.confirmNewPassword ? (
              <p className="mt-1 text-xs text-danger">
                {errors.confirmNewPassword.message}
              </p>
            ) : null}
          </div>

          {resetPassword.isError ? (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
              {extractErrorMessage(resetPassword.error)}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            isLoading={resetPassword.isPending}
          >
            Reset Password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
