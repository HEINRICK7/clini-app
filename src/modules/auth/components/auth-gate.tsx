"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, LogOut } from "lucide-react";

import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useCliniServices } from "@/app/service-container";
import { isUnauthorized } from "@/lib/error-policy";
import type { AuthSession } from "@/modules/auth/application/contracts";

const AuthContext = createContext<AuthSession | null>(null);
type CurrentUnitContextValue = {
  selectedUnitId: string | undefined;
  selectUnit: (unitId: string | undefined) => void;
};
const CurrentUnitContext = createContext<CurrentUnitContextValue | null>(null);

export function AuthGate({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const { auth } = useCliniServices();
  const sessionQuery = useQuery({ queryKey: ["auth-session"], queryFn: auth.getCurrentSession, retry: false });
  useEffect(() => {
    if (isUnauthorized(sessionQuery.error)) router.replace("/login");
  }, [router, sessionQuery.error]);

  if (sessionQuery.isPending || isUnauthorized(sessionQuery.error)) {
    return <Card className="mx-auto mt-10 max-w-md p-6"><p className="text-sm text-muted-foreground">Validando sua sessão…</p></Card>;
  }
  if (sessionQuery.isError || !sessionQuery.data) {
    return <Card className="mx-auto mt-10 max-w-md p-6"><p className="text-sm font-semibold text-danger">Não foi possível validar a sessão.</p><p className="mt-1 text-sm text-muted-foreground">Atualize a página ou entre novamente.</p></Card>;
  }
  return <AuthContext.Provider value={sessionQuery.data}><CurrentUnitProvider>{children}</CurrentUnitProvider></AuthContext.Provider>;
}

export function useAuthSession() {
  const session = useContext(AuthContext);
  if (!session) throw new Error("useAuthSession precisa estar dentro de AuthGate.");
  return session;
}

function CurrentUnitProvider({ children }: Readonly<{ children: ReactNode }>) {
  const session = useAuthSession();
  const storageKey = `clini-current-unit:${session.tenantId}`;
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return session.units.find((unit) => unit.primary && unit.status === "ACTIVE")?.id;
    const stored = window.localStorage.getItem(storageKey);
    const available = session.units.some((unit) => unit.id === stored && unit.status === "ACTIVE");
    return available ? stored ?? undefined : session.units.find((unit) => unit.primary && unit.status === "ACTIVE")?.id;
  });

  function selectUnit(unitId: string | undefined) {
    const available = session.units.some((unit) => unit.id === unitId && unit.status === "ACTIVE");
    const next = available ? unitId : undefined;
    setSelectedUnitId(next);
    if (next) window.localStorage.setItem(storageKey, next);
    else window.localStorage.removeItem(storageKey);
  }

  return <CurrentUnitContext.Provider value={{ selectedUnitId, selectUnit }}>{children}</CurrentUnitContext.Provider>;
}

export function useCurrentUnit() {
  const context = useContext(CurrentUnitContext);
  if (!context) throw new Error("useCurrentUnit precisa estar dentro de AuthGate.");
  return context;
}

export function SessionHeader() {
  const router = useRouter();
  const session = useAuthSession();
  const { auth } = useCliniServices();
  const logoutMutation = useMutation({ mutationFn: auth.logout, onSuccess: () => { router.replace("/login"); router.refresh(); } });
  return <div className="flex items-center gap-2"><Link aria-label="Abrir notificações" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-brand-navy transition-colors hover:bg-surface-muted" href="/more"><Bell aria-hidden="true" className="h-5 w-5" /></Link><UserAvatar name={session.name} seed={session.email} size="sm" /><button aria-label="Sair da conta" className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground disabled:opacity-60 sm:min-w-0 sm:px-3" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()} type="button"><LogOut aria-hidden="true" className="h-4 w-4" /><span className="hidden sm:inline">{logoutMutation.isPending ? "Saindo…" : "Sair"}</span></button></div>;
}
