import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getStoredToken } from "@/store/authStore";
import { ResetPassword } from "@/pages/ResetPassword";

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: resetPasswordSearchSchema,
  beforeLoad: () => {
    if (getStoredToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: ResetPassword,
});