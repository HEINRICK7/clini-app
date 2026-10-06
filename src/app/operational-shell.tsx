"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarDays, House, MoreHorizontal, UsersRound } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AuthGate, SessionHeader } from "@/modules/auth/components/auth-gate";

const navigation = [
  { href: "/", label: "Hoje", icon: House },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/patients", label: "Pacientes", icon: UsersRound },
  { href: "/more", label: "Mais", icon: MoreHorizontal },
];

export function OperationalShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return <AuthGate>
    <main className="min-h-screen w-full min-w-0 bg-background px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 sm:pb-28 sm:pt-5 lg:px-10">
      <div className="mx-auto flex min-w-0 w-full max-w-6xl flex-col gap-5">
        <header className="flex min-h-12 min-w-0 items-center justify-between gap-2 px-1 sm:px-2">
          <BrandLogo compact priority={pathname === "/"} />
          <SessionHeader />
        </header>
        {children}
        <nav aria-label="Navegação principal" className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))] right-[max(0.75rem,env(safe-area-inset-right))] z-30 mx-auto grid max-w-2xl grid-cols-4 gap-1 rounded-2xl border border-border bg-surface/95 p-1.5 shadow-lg backdrop-blur sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:p-2">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link aria-current={active ? "page" : undefined} className={`inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center text-[10px] font-semibold leading-tight transition-colors sm:px-2 sm:text-[11px] ${active ? "text-primary" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"}`} href={item.href} key={item.href}><Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2} /><span className="max-w-full break-words">{item.label}</span></Link>;
          })}
        </nav>
      </div>
    </main>
  </AuthGate>;
}
