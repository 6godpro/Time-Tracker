import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface JwtPayload {
  userId: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}

export interface GooglePendingPayload {
  type: "google_pending";
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function signGooglePendingToken(payload: Omit<GooglePendingPayload, "type">): string {
  return jwt.sign({ type: "google_pending", ...payload }, env.jwtSecret, { expiresIn: "10m" });
}

export function verifyGooglePendingToken(token: string): GooglePendingPayload {
  const payload = jwt.verify(token, env.jwtSecret) as GooglePendingPayload;
  if (payload.type !== "google_pending") {
    throw new Error("Not a Google pending token.");
  }
  return payload;
}