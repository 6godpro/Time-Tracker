import { useCallback, useEffect, useRef, useState } from "react";
import { getStoredToken, useAuthStore } from "@/store/authStore";
import { useLogout } from "@/hooks/useAuth";

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const IDLE_WARNING_MS = 60 * 1000; // 60 seconds

const LAST_ACTIVITY_KEY = "time_tracker_last_activity";
const TOKEN_KEY = "time_tracker_token";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
] as const;

const ACTIVITY_WRITE_THROTTLE_MS = 5 * 1000;

function readLastActivity(): number {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  return raw ? Number(raw) : Date.now();
}

export function useIdleTimeout() {
  const logout = useLogout();
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  const hasSession = useAuthStore((s) => Boolean(s.token));
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const lastWriteRef = useRef(0);

  const secondsRemainingRef = useRef<number | null>(null);
  useEffect(() => {
    secondsRemainingRef.current = secondsRemaining;
  }, [secondsRemaining]);

  const recordActivity = useCallback(() => {
    if (secondsRemainingRef.current !== null) return;

    const now = Date.now();
    if (now - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return;
    lastWriteRef.current = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  }, []);

  const stayActive = useCallback(() => {
    const now = Date.now();
    lastWriteRef.current = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    setSecondsRemaining(null);
  }, []);

  useEffect(() => {
    if (!hasSession) return;

    const now = Date.now();
    const priorActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

    if (priorActivity && now - Number(priorActivity) >= IDLE_TIMEOUT_MS) {
      logoutRef.current();
      return;
    }

    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    lastWriteRef.current = now;

    ACTIVITY_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, recordActivity),
    );

    function handleStorage(event: StorageEvent) {
      if (event.key === TOKEN_KEY && event.newValue === null) {
        logoutRef.current();
      }
    }
    window.addEventListener("storage", handleStorage);

    const intervalId = window.setInterval(() => {
      if (!getStoredToken()) {
        window.clearInterval(intervalId);
        return;
      }

      const remainingMs = readLastActivity() + IDLE_TIMEOUT_MS - Date.now();

      if (remainingMs <= 0) {
        setSecondsRemaining(null);
        logoutRef.current();
        return;
      }

      setSecondsRemaining(
        remainingMs <= IDLE_WARNING_MS ? Math.ceil(remainingMs / 1000) : null,
      );
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, recordActivity),
      );
      window.removeEventListener("storage", handleStorage);
      window.clearInterval(intervalId);
    };
  }, [hasSession, recordActivity]);

  return {
    showWarning: secondsRemaining !== null,
    secondsRemaining: secondsRemaining ?? 0,
    stayActive,
  };
}
