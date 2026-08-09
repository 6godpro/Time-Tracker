import { createFileRoute } from "@tanstack/react-router";
import { AdminEmployeeDetail } from "@/pages/Admin";

export const Route = createFileRoute("/_authenticated/admin/employees/$employeeId")({
  component: AdminEmployeeDetailRoute,
});

function AdminEmployeeDetailRoute() {
  const { employeeId } = Route.useParams();
  return <AdminEmployeeDetail employeeId={employeeId} />;
}
