import { apiRequest } from "@/lib/api/client";

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthSession = {
  userId: string;
  email: string;
  name: string;
  role: "OWNER";
  tenantId: string;
  units: Array<{ id: string; name: string; status: "ACTIVE" | "INACTIVE"; primary: boolean; timezone: string }>;
  capabilities: string[];
};

export function login(input: LoginInput) {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentSession() {
  return apiRequest<AuthSession>("/auth/me");
}

export function logout() {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}
