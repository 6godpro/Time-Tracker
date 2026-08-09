import crypto from "node:crypto";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/config/prisma";
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
import {
  signAccessToken,
  signGooglePendingToken,
  verifyGooglePendingToken,
} from "@/utils/jwt";
import { sendAccountDeletionEmail, sendPasswordResetEmail, sendVerificationEmail } from "@/utils/mailer";
import {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
} from "../validators/auth.validators";
import { fullName } from "@/utils/name";

let googleClient: OAuth2Client | null = null;

function getGoogleClient(): OAuth2Client {
  if (!env.googleClientId) {
    throw new AppError("Google sign-in is not configured.", 500);
  }
  if (!googleClient) {
    googleClient = new OAuth2Client(env.googleClientId);
  }
  return googleClient;
}

const SALT_ROUNDS = 10;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const ACCOUNT_DELETION_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function toPublicUser(user: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  hourlyRateCents: number;
}) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: fullName(user),
    email: user.email,
    createdAt: user.createdAt,
    role: user.role,
    jobTitle: user.jobTitle,
    emailVerified: user.emailVerified,
    hourlyRateCents: user.hourlyRateCents,
  };
}

async function issueAndSendVerificationEmail(user: {
  id: string;
  email: string;
  firstName: string;
}): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: hashToken(rawToken),
      emailVerificationTokenExpiresAt: new Date(
        Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS,
      ),
    },
  });

  const verifyLink = `${env.frontendUrl}/verify-email?token=${rawToken}`;

  await sendVerificationEmail(user.email, user.firstName, verifyLink);
}

export async function registerUser(
  input: RegisterInput,
): Promise<{ message: string }> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      jobTitle: input.jobTitle,
      email: input.email,
      password: hashedPassword,
      role: "EMPLOYEE",
      emailVerified: false,
    },
  });

  await issueAndSendVerificationEmail(user);

  return {
    message:
      "Account created. Check your email to verify your address before logging in.",
  };
}

export async function loginUser(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.password) {
    throw new AppError(
      'This account signs in with Google. Use the "Continue with Google" button instead.',
      401,
      {
        code: "GOOGLE_ACCOUNT_NO_PASSWORD",
      },
    );
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.emailVerified) {
    throw new AppError("Please verify your email before logging in.", 403, {
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  const token = signAccessToken({ userId: user.id });

  return { user: toPublicUser(user), token };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return toPublicUser(user);
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!user.password) {
    throw new AppError(
      "This account doesn't have a password yet — it signs in with Google.",
      400,
      {
        code: "GOOGLE_ACCOUNT_NO_PASSWORD",
      },
    );
  }

  const currentPasswordMatches = await bcrypt.compare(
    input.currentPassword,
    user.password,
  );

  if (!currentPasswordMatches) {
    throw new AppError("Current password is incorrect.", 401);
  }

  const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return;
  }

  const rawToken = crypto.randomBytes(32).toString("hex");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: hashToken(rawToken),
      passwordResetTokenExpiresAt: new Date(
        Date.now() + PASSWORD_RESET_TOKEN_TTL_MS,
      ),
    },
  });

  const resetLink = `${env.frontendUrl}/reset-password?token=${rawToken}`;

  await sendPasswordResetEmail(user.email, user.firstName, resetLink);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: hashToken(token),
      passwordResetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(
      "This reset link is invalid or has expired. Request a new one.",
      400,
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    },
  });
}

export async function verifyEmail(token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: hashToken(token),
      emailVerificationTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new AppError(
      "This verification link is invalid or has expired. Request a new one.",
      400,
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationTokenExpiresAt: null,
    },
  });
}

export async function resendVerificationEmail(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerified) {
    return;
  }

  await issueAndSendVerificationEmail(user);
}

interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
}

async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const client = getGoogleClient();

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(
      "Your Google sign-in could not be verified. Please try again.",
      401,
    );
  }

  if (!payload?.sub || !payload.email) {
    throw new AppError(
      "Your Google sign-in could not be verified. Please try again.",
      401,
    );
  }

  if (!payload.email_verified) {
    throw new AppError(
      "Your Google account's email address isn't verified.",
      401,
    );
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    firstName: payload.given_name ?? "",
    lastName: payload.family_name ?? "",
  };
}

async function linkOrReuseGoogleAccount(
  existing: { id: string; googleId: string | null },
  googleId: string,
) {
  if (existing.googleId) {
    return prisma.user.findUniqueOrThrow({ where: { id: existing.id } });
  }
  return prisma.user.update({
    where: { id: existing.id },
    data: { googleId, emailVerified: true },
  });
}

export type GoogleAuthResult =
  | {
      status: "signed_in";
      user: ReturnType<typeof toPublicUser>;
      token: string;
    }
  | { status: "needs_job_title"; pendingToken: string };

export async function googleAuth(idToken: string): Promise<GoogleAuthResult> {
  const profile = await verifyGoogleIdToken(idToken);

  const existing = await prisma.user.findUnique({
    where: { email: profile.email },
  });

  if (existing) {
    const user = await linkOrReuseGoogleAccount(existing, profile.googleId);
    const token = signAccessToken({ userId: user.id });
    return { status: "signed_in", user: toPublicUser(user), token };
  }

  const pendingToken = signGooglePendingToken({
    googleId: profile.googleId,
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
  });

  return { status: "needs_job_title", pendingToken };
}

export async function completeGoogleSignup(
  pendingToken: string,
  jobTitle: string,
) {
  let pending;
  try {
    pending = verifyGooglePendingToken(pendingToken);
  } catch {
    throw new AppError(
      'This sign-up has expired. Please try "Continue with Google" again.',
      401,
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email: pending.email },
  });

  if (existing) {
    const user = await linkOrReuseGoogleAccount(existing, pending.googleId);
    const token = signAccessToken({ userId: user.id });
    return { user: toPublicUser(user), token };
  }

  const user = await prisma.user.create({
    data: {
      firstName: pending.firstName || "Google",
      lastName: pending.lastName || "User",
      email: pending.email,
      jobTitle,
      googleId: pending.googleId,
      role: "EMPLOYEE",
      emailVerified: true,
      password: null,
    },
  });

  const token = signAccessToken({ userId: user.id });
  return { user: toPublicUser(user), token };
}

async function assertCanDeleteAccount(user: { id: string; role: string }): Promise<void> {
  if (user.role !== "ADMIN") {
    return;
  }

  const otherAdminCount = await prisma.user.count({
    where: { role: "ADMIN", id: { not: user.id } },
  });

  if (otherAdminCount === 0) {
    throw new AppError(
      "You're the only admin on this account. Promote another employee to admin before deleting your account.",
      409,
    );
  }
}

export async function requestAccountDeletion(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found.", 404);
  }
  await assertCanDeleteAccount(user);

  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      accountDeletionTokenHash: hashToken(rawToken),
      accountDeletionTokenExpiresAt: new Date(Date.now() + ACCOUNT_DELETION_TOKEN_TTL_MS),
    },
  });

  const deleteLink = `${env.frontendUrl}/delete-account?token=${rawToken}`;
  await sendAccountDeletionEmail(user.email, user.firstName, deleteLink);
}

export async function confirmAccountDeletion(token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      accountDeletionTokenHash: hashToken(token),
      accountDeletionTokenExpiresAt: { gt: new Date() },
    },
  });
  if (!user) {
    throw new AppError("This deletion link is invalid or has expired. Request a new one from Settings.", 400);
  }
  await assertCanDeleteAccount(user);
  await prisma.user.delete({ where: { id: user.id } });
}