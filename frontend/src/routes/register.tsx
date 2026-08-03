import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/store/authStore";
import { Register } from "@/pages/Register";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    if (getStoredToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Register,
});
