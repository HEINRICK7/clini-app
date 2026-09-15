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
  city?: string | undefined;
  message?: string | undefined;
};

export const commercialLeadInputSchema = z.object({
  name: z.string({ error: "Informe seu nome completo." }).trim().min(1, "Informe seu nome completo.").max(180),
  email: z.string({ error: "Informe um e-mail válido." }).trim().email("Informe um e-mail válido.").max(254),
  whatsapp: z.string({ error: "Informe seu WhatsApp com DDD." }).trim().min(1, "Informe seu WhatsApp com DDD.").max(32)
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }, "Informe um WhatsApp válido com DDD."),
  city: z.string().trim().max(120).optional(),
  message: z.string().trim().max(2000).optional(),
});

const commercialLeadResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.literal("NEW"),
});

export async function submitCommercialLead(input: CommercialLeadInput) {
  const validatedInput = commercialLeadInputSchema.parse(input);
  return commercialLeadResponseSchema.parse(await apiRequest<unknown>("/public/commercial-leads", {
    method: "POST",
    body: JSON.stringify(validatedInput),
  }));
}

export async function getInvitationDetails(token: string): Promise<InvitationDetails> {
  return invitationDetailsSchema.parse(await apiRequest<unknown>(`/auth/invitations/${encodeURIComponent(token)}`));
}

export async function activateInvitation(
  token: string,
  input: { password: string; confirmPassword: string; termsAccepted: boolean },
) {
  const validatedInput = activateInvitationInputSchema.parse(input);
  return apiRequest<AuthSession>(`/auth/invitations/${encodeURIComponent(token)}/activate`, {
    method: "POST",
    body: JSON.stringify(validatedInput),
  });
}

export const activateInvitationInputSchema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128),
  confirmPassword: z.string().min(8, "A confirmação deve ter pelo menos 8 caracteres.").max(128),
  termsAccepted: z.literal(true, { error: "Aceite os termos para continuar." }),
}).refine((input) => input.password === input.confirmPassword, {
  message: "As senhas precisam ser iguais.",
  path: ["confirmPassword"],
});
