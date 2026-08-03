import { createFileRoute, redirect } from "@tanstack/react-router";
import { getStoredToken } from "@/store/authStore";
import { Landing } from "@/pages/Landing";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (getStoredToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: Landing,
});
