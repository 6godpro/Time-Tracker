import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/store/authStore";
import { ForgotPassword } from "@/pages/ForgotPassword";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: () => {
    if (getStoredToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: ForgotPassword,
});