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

export type InvitationDetails = {
  name: string;
  email: string;
  status: "PENDING";
  expiresAt: string;
};

export type ActivationInput = {
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
};
