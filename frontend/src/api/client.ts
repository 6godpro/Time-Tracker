import axios from "axios";
import { getStoredToken, useAuthStore } from "@/store/authStore";


const host = window.location.hostname

export const apiClient = axios.create({
  baseURL: `http://${host}:${import.meta.env.VITE_API_PORT}`,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession();
    }
    return Promise.reject(error);
  }
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === "string") return message;
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function extractErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.error?.details?.code;
    if (typeof code === "string") return code;
  }
  return undefined;
}
