import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/Button";
import { useForgotPassword } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/api/client";

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const forgotPassword = useForgotPassword();
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const onSubmit = (values: ForgotPasswordForm) => {
    forgotPassword.mutate(values, {
      onSuccess: (data) => {
        setSubmittedMessage(data.message);
      },
    });
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="We'll email you a link to reset it"
    >
      {submittedMessage ? (
        <div className="space-y-4 text-center">
          <p className="rounded-lg bg-status-working-bg px-3 py-2 text-sm text-status-working">
            {submittedMessage}
          </p>
          <p className="text-sm text-ink-soft">
            Didn&apos;t get it? Check spam, or{" "}
            <button
              type="button"
              onClick={() => setSubmittedMessage(null)}
              className="font-medium text-brand hover:underline"
            >
              try again
            </button>
            .
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              {...register("email")}
              placeholder="Email"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            ) : null}
          </div>

          {forgotPassword.isError ? (
            <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
              {extractErrorMessage(forgotPassword.error)}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            isLoading={forgotPassword.isPending}
          >
            Send Reset Link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link to="/login" className="font-medium text-brand hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
