import type { AuthGateway } from "./auth-gateway";
import type { AuthSession, LoginInput } from "./contracts";

export async function authenticate(gateway: Pick<AuthGateway, "login">, input: LoginInput) {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    throw new Error("Informe seu e-mail e sua senha.");
  }
  return gateway.login({ email, password: input.password });
}

export function destinationAfterLogin(session: AuthSession) {
  const activeUnits = session.units.filter((unit) => unit.status === "ACTIVE");
  return activeUnits.length > 1 ? "/select-unit" : "/";
}
