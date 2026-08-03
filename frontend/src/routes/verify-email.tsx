import { VerifyEmail } from "@/pages/VerifyEmail";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";


const verifyEmailSearchSchema = z.object({
  token: z.string().optional(),
});

// Deliberately no `beforeLoad` redirect-if-logged-in guard here, unlike the
// other auth routes. Verifying an email is a harmless, idempotent action
// regardless of whether the browser happens to have an existing session —
// blocking it would prevent a logged-in user from completing verification
// tied to a different account (e.g. one they just registered in another tab).
export const Route = createFileRoute("/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  component: VerifyEmail,
});