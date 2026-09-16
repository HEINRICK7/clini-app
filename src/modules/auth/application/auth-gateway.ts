import type { ActivationInput, AuthSession, InvitationDetails, LoginInput } from "./contracts";

export type AuthGateway = {
  login: (input: LoginInput) => Promise<AuthSession>;
  getCurrentSession: () => Promise<AuthSession>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (input: { token: string; password: string; confirmPassword: string }) => Promise<void>;
  getInvitationDetails: (token: string) => Promise<InvitationDetails>;
  activateInvitation: (token: string, input: ActivationInput) => Promise<AuthSession>;
};
