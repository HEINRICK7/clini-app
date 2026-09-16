"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Bell, Building2, ChevronRight, CircleHelp, LogOut, SlidersHorizontal, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { logout } from "@/modules/auth/api";
import { useAuthSession, useCurrentUnit } from "@/modules/auth/components/auth-gate";

export function SettingsWorkspace() {
  const router = useRouter();
  const session = useAuthSession();
  const { selectedUnitId } = useCurrentUnit();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      router.replace("/login");
      router.refresh();
    },
  });
  const currentUnit = session.units.find((unit) => unit.id === selectedUnitId) ?? session.units.find((unit) => unit.primary && unit.status === "ACTIVE");

  return <section className="mx-auto w-full max-w-2xl">
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-5 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <UserAvatar name={session.name} seed={session.email} size="lg" />
          <div className="min-w-0"><h2 className="truncate text-lg font-bold text-brand-navy">{session.name}</h2><p className="mt-0.5 text-sm text-muted-foreground">Dentista · Proprietário</p></div>
        </div>
      </div>
      <div className="divide-y divide-border">
        <SettingsRow icon={UserRound} label="Meu perfil" detail={session.email} />
        <SettingsRow icon={Building2} label="Consultório atual" detail={currentUnit?.name ?? "Nenhum local selecionado"} />
        <SettingsRow icon={Bell} label="Notificações" detail="Preferências de aviso" />
        <SettingsRow icon={SlidersHorizontal} label="Preferências" detail="Ajustes do sistema" />
        <SettingsRow icon={CircleHelp} label="Ajuda e suporte" detail="Como podemos ajudar?" />
      </div>
      <div className="border-t border-border p-5 sm:px-6"><Button className="w-full justify-center border-danger/20 text-danger hover:bg-danger/10" disabled={logoutMutation.isPending} onClick={() => logoutMutation.mutate()} variant="outline"><LogOut aria-hidden="true" className="h-4 w-4" />{logoutMutation.isPending ? "Saindo…" : "Sair da conta"}</Button></div>
    </Card>
  </section>;
}

function SettingsRow({ icon: Icon, label, detail }: { icon: typeof UserRound; label: string; detail: string }) {
  return <div className="flex min-h-18 items-center gap-3 px-5 py-3 sm:px-6"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-brand-navy"><Icon aria-hidden="true" className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{label}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{detail}</span></span><ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" /></div>;
}
