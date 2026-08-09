import { Router } from "express";
import {
  changePasswordHandler,
  completeGoogleSignupHandler,
  confirmAccountDeletionHandler,
  forgotPasswordHandler,
  googleAuthHandler,
  login,
  me,
  register,
  requestAccountDeletionHandler,
  resendVerificationHandler,
  resetPasswordHandler,
  verifyEmailHandler,
} from "../controllers/auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));
router.patch("/change-password", requireAuth, asyncHandler(changePasswordHandler));
router.post("/request-delete-account", requireAuth, asyncHandler(requestAccountDeletionHandler));
router.post("/confirm-delete-account", asyncHandler(confirmAccountDeletionHandler));
router.post("/forgot-password", asyncHandler(forgotPasswordHandler));
router.post("/reset-password", asyncHandler(resetPasswordHandler));
router.post("/verify-email", asyncHandler(verifyEmailHandler));
router.post("/resend-verification", asyncHandler(resendVerificationHandler));
router.post("/google", asyncHandler(googleAuthHandler));
router.post("/google/complete", asyncHandler(completeGoogleSignupHandler));

export default router;
