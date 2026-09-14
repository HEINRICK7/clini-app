"use client";

import Image from "next/image";
import { CalendarDays, FileText, Stethoscope, UsersRound } from "lucide-react";

const highlights = [
  { icon: UsersRound, title: "Pacientes", description: "Organize e acompanhe o histórico dos seus pacientes." },
  { icon: CalendarDays, title: "Agenda", description: "Facilite sua rotina de atendimentos." },
  { icon: FileText, title: "Registros clínicos", description: "Tenha tudo em um só lugar, com mais segurança." },
];

export function WelcomeScreen() {
  return (
    <section
      aria-labelledby="welcome-title"
      className="flex min-h-[100dvh] w-full max-w-md flex-col bg-surface px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-8"
    >
      <div className="flex justify-center">
        <Image alt="Clini" className="h-auto w-20" height={1254} priority src="/icon-sem-slogan.png" width={1254} />
      </div>

      <div aria-hidden="true" className="mt-8 flex justify-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-full bg-blue-50 text-primary">
          <Stethoscope className="h-20 w-20" strokeWidth={1.6} />
        </div>
      </div>

      <header className="mt-6 text-center">
        <h1 className="text-2xl font-bold leading-[1.2] tracking-tight text-brand-navy" id="welcome-title">
          Bem-vinda ao Clini
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Vamos preparar o seu espaço para começar a atender.</p>
      </header>

      <div className="mt-6 grid gap-4">
        {highlights.map(({ description, icon: Icon, title }) => (
          <div className="flex items-start gap-3" key={title}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="pt-0.5">
              <h2 className="text-sm font-bold text-brand-navy">{title}</h2>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-7 inline-flex h-[52px] min-h-0 w-full items-center justify-center rounded-xl bg-primary px-4 text-center text-sm font-semibold text-primary-foreground shadow-none transition-colors hover:bg-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" type="button">
        Configurar meu primeiro consultório
      </button>
    </section>
  );
}
