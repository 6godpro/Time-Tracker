import { apiClient } from "./client";
import type { AuthResponse, GoogleAuthResponse, User } from "@/types/auth";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface GoogleAuthPayload {
  idToken: string;
}

export interface CompleteGoogleSignupPayload {
  pendingToken: string;
  jobTitle: string;
}

export async function registerRequest(payload: RegisterPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/register", payload);
  return data;
}

export async function loginRequest(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function meRequest(): Promise<{ user: User }> {
  const { data } = await apiClient.get<{ user: User }>("/auth/me");
  return data;
}

export async function changePasswordRequest(payload: ChangePasswordPayload): Promise<{ user: User }> {
  const { data } = await apiClient.patch<{ user: User }>("/auth/change-password", payload);
  return data;
}

export interface ConfirmAccountDeletionPayload {
  token: string;
}

export async function requestAccountDeletionRequest(): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/request-delete-account");
  return data;
}

export async function confirmAccountDeletionRequest(
  payload: ConfirmAccountDeletionPayload,
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/confirm-delete-account", payload);
  return data;
}

export async function forgotPasswordRequest(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", payload);
  return data;
}

export async function resetPasswordRequest(payload: ResetPasswordPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/reset-password", payload);
  return data;
}

export async function verifyEmailRequest(payload: VerifyEmailPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/verify-email", payload);
  return data;
}

export async function resendVerificationRequest(payload: ResendVerificationPayload): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>("/auth/resend-verification", payload);
  return data;
}

export async function googleAuthRequest(payload: GoogleAuthPayload): Promise<GoogleAuthResponse> {
  const { data } = await apiClient.post<GoogleAuthResponse>("/auth/google", payload);
  return data;
}

export async function completeGoogleSignupRequest(payload: CompleteGoogleSignupPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/google/complete", payload);
  return data;
}