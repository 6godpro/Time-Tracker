import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { getStoredToken, useAuthStore } from "@/store/authStore";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader } from "@/components/Loader";
import { IdleWarningModal } from "@/components/IdleWarningModal";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useLogout } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (!getStoredToken()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: user, isLoading, isError } = useCurrentUser();
  const setUser = useAuthStore((s) => s.setUser);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const { showWarning, secondsRemaining, stayActive } = useIdleTimeout();
  const logout = useLogout();

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  useEffect(() => {
    if (isError) {
      clearSession();
      navigate({ to: "/login" });
    }
  }, [isError, clearSession, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <Loader label="Loading your account" />
      </div>
    );
  }

  return (
    <>
      <Outlet />
      <IdleWarningModal open={showWarning} secondsRemaining={secondsRemaining} onStayActive={stayActive} logout={logout} />
    </>
  );
}
