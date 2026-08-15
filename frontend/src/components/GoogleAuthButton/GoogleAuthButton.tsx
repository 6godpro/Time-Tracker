import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/Button";
import { Select } from "@/components/Select";
import { useGoogleAuth, useCompleteGoogleSignup } from "@/hooks/useAuth";
import { useActiveJobs } from "@/hooks/useJobs";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { extractErrorMessage } from "@/api/client";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
            },
          ) => void;
        };
      };
    };
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export const isGoogleAuthConfigured = Boolean(CLIENT_ID);

export function GoogleAuthButton({ mode }: { mode: "signin" | "signup" }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const googleAuth = useGoogleAuth();
  const completeSignup = useCompleteGoogleSignup();
  const { data: jobs } = useActiveJobs();

  const [error, setError] = useState<string | null>(null);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [jobId, setJobId] = useState("");
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [gsiReady, setGsiReady] = useState(false);

  const handleCredentialRef = useRef<
    (response: { credential: string }) => void
  >(() => {});
  handleCredentialRef.current = (response) => {
    setError(null);
    googleAuth.mutate(
      { idToken: response.credential },
      {
        onSuccess: (result) => {
          if (result.status === "signed_in") {
            setSession(result.token, result.user);
            navigate({ to: "/dashboard" });
          } else {
            setPendingToken(result.pendingToken);
          }
        },
        onError: (err) => setError(extractErrorMessage(err)),
      },
    );
  };

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!CLIENT_ID || initializedRef.current) {
      return;
    }

    let cancelled = false;
    let intervalId: number | undefined;

    function tryInit(): boolean {
      if (!window.google?.accounts?.id) {
        return false;
      }
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID as string,
        callback: (response) => handleCredentialRef.current(response),
      });
      initializedRef.current = true;
      setGsiReady(true);
      return true;
    }

    if (!tryInit()) {
      intervalId = window.setInterval(() => {
        if (tryInit() && !cancelled && intervalId) {
          window.clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (
      !gsiReady ||
      pendingToken ||
      !buttonRef.current ||
      !window.google?.accounts?.id
    ) {
      return;
    }

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      type: "standard",
      theme: theme === "dark" ? "filled_black" : "outline",
      size: "large",
      width: 320,
      text: mode === "signup" ? "signup_with" : "signin_with",
      shape: "rectangular",
    });
  }, [gsiReady, theme, mode, pendingToken]);

  if (!CLIENT_ID) {
    return null;
  }

  if (pendingToken) {
    return (
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="mb-3 text-sm font-medium text-ink">
          One more thing — what's your job title?
        </p>
        <div className="space-y-3">
          <Select
            value={jobId}
            onChange={setJobId}
            options={(jobs ?? []).map((job) => ({
              value: job.id,
              label: job.name,
            }))}
            placeholder="Select a job title"
            hasError={Boolean(completeError)}
          />
          {completeError ? (
            <p className="text-xs text-danger">{completeError}</p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            isLoading={completeSignup.isPending}
            disabled={!jobId}
            onClick={() => {
              setCompleteError(null);
              completeSignup.mutate(
                { pendingToken, jobId },
                {
                  onError: (err) => setCompleteError(extractErrorMessage(err)),
                },
              );
            }}
          >
            Finish creating account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={buttonRef} className="flex justify-center" />
      {error ? (
        <p className="mt-2 text-center text-xs text-danger">{error}</p>
      ) : null}
    </div>
  );
}
