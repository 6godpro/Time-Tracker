import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DeleteAccountConfirm } from "@/pages/DeleteAccountConfirm";

const deleteAccountSearchSchema = z.object({
  token: z.string().optional(),
});

// Deliberately no `beforeLoad` redirect-if-logged-in guard here, unlike
// login/register/reset-password. The common case is the opposite of
// those — someone requests deletion from Settings while logged in, then
// opens the emailed link in the same browser a minute later, so blocking
// this page for an authenticated session would break the normal flow.
export const Route = createFileRoute("/delete-account")({
  validateSearch: deleteAccountSearchSchema,
  component: DeleteAccountConfirm,
});