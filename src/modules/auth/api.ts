import { z } from "zod";

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

const invitationDetailsSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  status: z.literal("PENDING"),
  expiresAt: z.string().min(1),
});

export type InvitationDetails = z.infer<typeof invitationDetailsSchema>;

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

export type CommercialLeadInput = {
  name: string;
  email: string;
  whatsapp: string;
  city?: string;
  message?: string;
};

const commercialLeadResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("NEW"),
});

export async function submitCommercialLead(input: CommercialLeadInput) {
  return commercialLeadResponseSchema.parse(await apiRequest<unknown>("/public/commercial-leads", {
    method: "POST",
    body: JSON.stringify(input),
  }));
}

export async function getInvitationDetails(token: string): Promise<InvitationDetails> {
  return invitationDetailsSchema.parse(await apiRequest<unknown>(`/auth/invitations/${encodeURIComponent(token)}`));
}

export async function activateInvitation(
  token: string,
  input: { password: string; confirmPassword: string; termsAccepted: boolean },
) {
  return apiRequest<AuthSession>(`/auth/invitations/${encodeURIComponent(token)}/activate`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
