import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/Button";
import { GoogleAuthButton, isGoogleAuthConfigured } from "@/components/GoogleAuthButton";
import { useLogin, useResendVerification } from "@/hooks/useAuth";
import { extractErrorCode, extractErrorMessage } from "@/api/client";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const login = useLogin();
  const resendVerification = useResendVerification();
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const isUnverified = login.isError && extractErrorCode(login.error) === "EMAIL_NOT_VERIFIED";

  const handleResend = () => {
    const email = getValues("email");
    if (!email) return;
    setResendMessage(null);
    resendVerification.mutate(
      { email },
      { onSuccess: (data) => setResendMessage(data.message) }
    );
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to track your shift">
      {isGoogleAuthConfigured ? (
        <>
          <GoogleAuthButton mode="signin" />
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs font-medium text-ink-soft">or continue with email</span>
            <div className="h-px flex-1 bg-line" />
          </div>
        </>
      ) : null}

      <form
        onSubmit={handleSubmit((values) => {
          setResendMessage(null);
          login.mutate(values);
        })}
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
          {errors.email ? <p className="mt-1 text-xs text-danger">{errors.email.message}</p> : null}
        </div>

        <div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            {...register("password")}
            placeholder="Password"
          />
          {errors.password ? <p className="mt-1 text-xs text-danger">{errors.password.message}</p> : null}
          <div className="mt-1.5 text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-brand hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        {resendMessage ? (
          <p className="rounded-lg bg-status-working-bg px-3 py-2 text-sm text-status-working">
            {resendMessage}
          </p>
        ) : login.isError ? (
          <div className="space-y-2 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            <p>{extractErrorMessage(login.error)}</p>
            {isUnverified ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendVerification.isPending}
                className="font-medium text-danger-dark underline decoration-danger-border underline-offset-2 hover:opacity-80 disabled:opacity-60"
              >
                {resendVerification.isPending ? "Sending..." : "Resend verification email"}
              </button>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" className="w-full" isLoading={login.isPending}>
          Log In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-medium text-brand hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}