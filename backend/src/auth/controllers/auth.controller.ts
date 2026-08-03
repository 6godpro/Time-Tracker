import { Request, Response } from "express";
import {
  changePassword,
  completeGoogleSignup,
  getCurrentUser,
  googleAuth,
  loginUser,
  registerUser,
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "../services/auth.service";
import {
  changePasswordSchema,
  completeGoogleSignupSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../validators/auth.validators";

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response) {
  const user = await getCurrentUser(req.userId as string);
  res.status(200).json({ user });
}

export async function changePasswordHandler(req: Request, res: Response) {
  const input = changePasswordSchema.parse(req.body);
  await changePassword(req.userId as string, input);
  res.status(200).json({ message: "Password updated." });
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const input = forgotPasswordSchema.parse(req.body);
  await requestPasswordReset(input.email);
  res
    .status(200)
    .json({
      message:
        "If an account exists for that email, a reset link has been sent.",
    });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const input = resetPasswordSchema.parse(req.body);
  await resetPassword(input.token, input.newPassword);
  res
    .status(200)
    .json({ message: "Your password has been reset. You can now log in." });
}

export async function verifyEmailHandler(req: Request, res: Response) {
  const input = verifyEmailSchema.parse(req.body);
  await verifyEmail(input.token);
  res
    .status(200)
    .json({ message: "Your email has been verified. You can now log in." });
}

export async function resendVerificationHandler(req: Request, res: Response) {
  const input = resendVerificationSchema.parse(req.body);
  await resendVerificationEmail(input.email);
  res
    .status(200)
    .json({
      message: "If that account needs verifying, a new link has been sent.",
    });
}

export async function googleAuthHandler(req: Request, res: Response) {
  const input = googleAuthSchema.parse(req.body);
  const result = await googleAuth(input.idToken);
  res.status(200).json(result);
}

export async function completeGoogleSignupHandler(req: Request, res: Response) {
  const input = completeGoogleSignupSchema.parse(req.body);
  const result = await completeGoogleSignup(input.pendingToken, input.jobTitle);
  res.status(201).json(result);
}
