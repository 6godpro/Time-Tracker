import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/store/authStore";
import { Login } from "@/pages/Login";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (getStoredToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Login,
});
