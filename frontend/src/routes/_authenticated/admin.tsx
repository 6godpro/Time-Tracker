import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Admin } from "@/pages/Admin";
import { Loader } from "@/components/Loader";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminRoute,
});

function AdminRoute() {
  // Reads from the same cached query the authenticated layout already
  // populated, so this doesn't trigger an extra request.
  const { data: user, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && user.role !== "ADMIN") {
      navigate({ to: "/dashboard" });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader label="Checking access" />
      </div>
    );
  }

  return <Admin />;
}
