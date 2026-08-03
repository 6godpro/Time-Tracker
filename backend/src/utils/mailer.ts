import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!env.smtp.host) {
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in backend/.env to send account emails (password reset, email verification).",
    );
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth:
        env.smtp.user && env.smtp.password
          ? { user: env.smtp.user, pass: env.smtp.password }
          : undefined,
    });
  }

  return transporter;
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetLink: string,
): Promise<void> {
  await getTransporter().sendMail({
    from: env.smtp.from,
    to,
    subject: "Reset your TimeTrack password",
    text: [
      `Hi ${firstName},`,
      "",
      "We received a request to reset your TimeTracker password. Open the link below to choose a new one:",
      "",
      resetLink,
      "",
      "This link expires in 1 hour and can only be used once. If you didn't request this, you can safely ignore this email — your password won't change.",
      "",
      "— TimeTracker",
    ].join("\n"),
    html: `
      <p>Hi ${firstName},</p>
      <p>We received a request to reset your TimeTracker password. Click the button below to choose a new one:</p>
      <p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">
          Reset Password
        </a>
      </p>
      <p>Or copy and paste this link into your browser:<br /><a href="${resetLink}">${resetLink}</a></p>
      <p style="color:#667085;font-size:13px;">This link expires in 1 hour and can only be used once. If you didn't request this, you can safely ignore this email — your password won't change.</p>
      <p>— TimeTracker</p>
    `,
  });
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  verifyLink: string,
): Promise<void> {
  await getTransporter().sendMail({
    from: env.smtp.from,
    to,
    subject: "Verify your TimeTracker email address",
    text: [
      `Hi ${firstName},`,
      "",
      "Thanks for signing up for TimeTracker. Open the link below to verify this email address — you'll need to do this before you can log in:",
      "",
      verifyLink,
      "",
      "This link expires in 24 hours. If you didn't create a TimeTracker account, you can safely ignore this email.",
      "",
      "— TimeTracker",
    ].join("\n"),
    html: `
      <p>Hi ${firstName},</p>
      <p>Thanks for signing up for TimeTracker. Click the button below to verify this email address — you'll need to do this before you can log in:</p>
      <p>
        <a href="${verifyLink}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;">
          Verify Email
        </a>
      </p>
      <p>Or copy and paste this link into your browser:<br /><a href="${verifyLink}">${verifyLink}</a></p>
      <p style="color:#667085;font-size:13px;">This link expires in 24 hours. If you didn't create a TimeTracker account, you can safely ignore this email.</p>
      <p>— TimeTracker</p>
    `,
  });
}
