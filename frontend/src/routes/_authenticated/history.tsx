import { createFileRoute } from "@tanstack/react-router";
import { History } from "@/pages/History";

export const Route = createFileRoute("/_authenticated/history")({
  component: History,
});
