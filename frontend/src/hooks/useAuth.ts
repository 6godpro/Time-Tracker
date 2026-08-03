import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  loginRequest,
  LoginPayload,
  registerRequest,
  RegisterPayload,
  ChangePasswordPayload,
  changePasswordRequest,
  ForgotPasswordPayload,
  forgotPasswordRequest,
  ResetPasswordPayload,
  resetPasswordRequest,
  verifyEmailRequest,
  ResendVerificationPayload,
  resendVerificationRequest,
  GoogleAuthPayload,
  googleAuthRequest,
  CompleteGoogleSignupPayload,
  completeGoogleSignupRequest,
} from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginRequest(payload),
    onSuccess: (data) => {
      setSession(data.token, data.user);
      navigate({ to: "/dashboard" });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    clearSession();
    queryClient.clear();
    navigate({ to: "/login" });
  };
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      changePasswordRequest(payload),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPasswordRequest(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPasswordRequest(payload),
  });
}

export function useVerifyEmailQuery(token: string | undefined) {
  return useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => verifyEmailRequest({ token: token as string }),
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: (payload: ResendVerificationPayload) => resendVerificationRequest(payload),
  });
}

export function useGoogleAuth() {
  return useMutation({
    mutationFn: (payload: GoogleAuthPayload) => googleAuthRequest(payload),
  });
}

export function useCompleteGoogleSignup() {
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: CompleteGoogleSignupPayload) => completeGoogleSignupRequest(payload),
    onSuccess: (data) => {
      setSession(data.token, data.user);
      navigate({ to: "/dashboard" });
    },
  });
}