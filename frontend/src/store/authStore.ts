import { create } from "zustand";
import type { User } from "@/types/auth";

const TOKEN_KEY = "time_tracker_token";

interface AuthState {
  token: string | null;
  user: User | null;
  isHydrated: boolean;
  setSession: (token: string, user: User) => void;
  setUser: (user: User) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  isHydrated: false,
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, user, isHydrated: true });
  },
  setUser: (user) => set({ user, isHydrated: true }),
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, isHydrated: true });
  },
}));

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
