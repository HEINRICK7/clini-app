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
    <main className="min-h-screen bg-background px-4 pb-24 pt-3 sm:px-6 sm:pb-28 sm:pt-5 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="flex min-h-12 items-center justify-between px-1 sm:px-2">
          <BrandLogo compact priority={pathname === "/"} />
          <SessionHeader />
        </header>
        {children}
        <nav aria-label="Navegação principal" className="fixed bottom-3 left-4 right-4 z-30 mx-auto grid max-w-2xl grid-cols-4 gap-1 rounded-2xl border border-border bg-surface/95 p-2 shadow-lg backdrop-blur sm:bottom-5">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link aria-current={active ? "page" : undefined} className={`inline-flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-[11px] font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"}`} href={item.href} key={item.href}><Icon aria-hidden="true" className="h-5 w-5" strokeWidth={active ? 2.5 : 2} /><span>{item.label}</span></Link>;
          })}
        </nav>
      </div>
    </main>
  </AuthGate>;
}
