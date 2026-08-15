import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  loginRequest,
  LoginPayload,
  registerRequest,
  RegisterPayload,
  ChangePasswordPayload,
  changePasswordRequest,
  ConfirmAccountDeletionPayload,
  confirmAccountDeletionRequest,
  requestAccountDeletionRequest,
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

// Registration no longer sets a session or navigates anywhere — the
// backend creates the account unverified and doesn't return a token
// (see registerRequest), so there's no session to set yet. The caller
// (Register.tsx) shows a "check your email" confirmation instead.
export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerRequest(payload),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    clearSession();
    await navigate({ to: "/login" });
    queryClient.clear();
  };
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      changePasswordRequest(payload),
  });
}

export function useRequestAccountDeletion() {
  return useMutation({
    mutationFn: () => requestAccountDeletionRequest(),
  });
}

// Deliberately doesn't navigate on success — the confirmation page shows
// its own "Account deleted" message with a link to log in, the same
// pattern useResetPassword and useVerifyEmailQuery's callers use, rather
// than redirecting out from under that message.
export function useConfirmAccountDeletion() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmAccountDeletionPayload) => confirmAccountDeletionRequest(payload),
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
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

// Deliberately useQuery, not a useMutation fired from a useEffect. Calling
// a mutation imperatively from an effect is a known trouble spot under
// React 18 StrictMode in dev: the double-invoked effect can leave the
// mutation's observer desynced from the actual in-flight request, so the
// request completes successfully on the server but the component's
// mutation state never advances past "pending". useQuery doesn't have
// this problem — React Query natively dedupes concurrent calls for the
// same queryKey, so StrictMode's double-invoke just shares the one
// underlying request instead of desyncing two of them. `token` is folded
// into the queryKey so a different token (e.g. after a resend) is treated
// as a fresh query rather than reusing a stale result.
export function useVerifyEmailQuery(token: string | undefined) {
  return useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => verifyEmailRequest({ token: token as string }),
    enabled: Boolean(token),
    retry: false,
    // The token is single-use — once this resolves (success or failure),
    // there's nothing to ever refetch for the same token.
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
