export type Role = "EMPLOYEE" | "ADMIN";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobId: string;
  jobTitle: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  hourlyRateCents: number;
  clientName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type GoogleAuthResponse =
  | { status: "signed_in"; user: User; token: string }
  | { status: "needs_job_title"; pendingToken: string };