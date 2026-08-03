import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/Button";
import { GoogleAuthButton, isGoogleAuthConfigured } from "@/components/GoogleAuthButton";
import { useRegister } from "@/hooks/useAuth";
import { extractErrorMessage } from "@/api/client";
import { JOB_TITLES } from "@/constants/jobTitles";
import { Select } from "@/components/Select";

const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    jobTitle: z.enum(JOB_TITLES, {
      errorMap: () => ({ message: "Select a job title" }),
    }),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const registerUser = useRegister();
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const textFields = [
    {
      name: "firstName" as const,
      label: "First Name",
      type: "text",
      autoComplete: "given-name",
    },
    {
      name: "lastName" as const,
      label: "Last Name",
      type: "text",
      autoComplete: "family-name",
    },
  ];

  if (submittedMessage) {
    return (
      <AuthLayout title="Check your email" subtitle="One more step before you can log in">
        <div className="space-y-4 text-center">
          <p className="rounded-lg bg-status-working-bg px-3 py-2 text-sm text-status-working">
            {submittedMessage}
          </p>
          <p className="text-sm text-ink-soft">
            Verification link expired or never arrived?{" "}
            <Link to="/login" className="font-medium text-brand hover:underline">
              Try logging in
            </Link>{" "}
            — we'll let you resend it from there.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start tracking your work hours"
    >
      {isGoogleAuthConfigured ? (
        <>
          <GoogleAuthButton mode="signup" />
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs font-medium text-ink-soft">or continue with email</span>
            <div className="h-px flex-1 bg-line" />
          </div>
        </>
      ) : null}

      <form
        onSubmit={handleSubmit((values) =>
          registerUser.mutate(values, {
            onSuccess: (data) => setSubmittedMessage(data.message),
          })
        )}
        className="space-y-4"
        noValidate
      >
        {textFields.map((field) => (
          <div key={field.name}>
            <input
              id={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              {...register(field.name)}
              placeholder={field.label}
            />
            {errors[field.name] ? (
              <p className="mt-1 text-xs text-danger">
                {errors[field.name]?.message}
              </p>
            ) : null}
          </div>
        ))}

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

        <div>
          <Controller
            name="jobTitle"
            control={control}
            defaultValue={undefined}
            render={({ field }) => (
              <Select
                ref={field.ref}
                id="jobTitle"
                name={field.name}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                options={JOB_TITLES}
                placeholder="Select a job title"
                hasError={Boolean(errors.jobTitle)}
              />
            )}
          />
          {errors.jobTitle ? (
            <p className="mt-1 text-xs text-danger">
              {errors.jobTitle.message}
            </p>
          ) : null}
        </div>

        <div>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            {...register("password")}
            placeholder="Password"
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-danger">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            {...register("confirmPassword")}
            placeholder="Confirm Password"
          />
          {errors.confirmPassword ? (
            <p className="mt-1 text-xs text-danger">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        {registerUser.isError ? (
          <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
            {extractErrorMessage(registerUser.error)}
          </p>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          isLoading={registerUser.isPending}
        >
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}