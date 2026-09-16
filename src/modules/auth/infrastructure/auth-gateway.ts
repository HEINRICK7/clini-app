import {
  activateInvitation,
  getCurrentSession,
  getInvitationDetails,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
} from "@/modules/auth/api";
import type { AuthGateway } from "@/modules/auth/application/auth-gateway";

export const authGateway: AuthGateway = {
  login,
  getCurrentSession,
  logout,
  requestPasswordReset,
  resetPassword,
  getInvitationDetails,
  activateInvitation,
};
