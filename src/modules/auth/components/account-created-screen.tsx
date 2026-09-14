"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";

export function AccountCreatedScreen() {
  const router = useRouter();

  return (
    <section
      aria-labelledby="account-created-title"
      className="flex min-h-[100dvh] w-full max-w-md flex-col items-center bg-surface px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-8"
    >
      <Image alt="Clini" className="h-auto w-20" height={1254} priority src="/icon-sem-slogan.png" width={1254} />

      <div className="mt-12 flex h-28 w-28 items-center justify-center rounded-full bg-blue-50 text-primary">
        <MailCheck aria-hidden="true" className="h-16 w-16" strokeWidth={1.8} />
      </div>

      <header className="mt-6 text-center">
        <h1 className="text-2xl font-bold leading-[1.2] tracking-tight text-brand-navy" id="account-created-title">
          Conta criada
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Enviamos as instruções para você continuar no Clini.</p>
      </header>

      <p className="mt-6 w-full rounded-xl bg-blue-50 px-5 py-4 text-center text-sm font-semibold leading-6 text-brand-navy">
        Verifique seu e-mail para ativar seu acesso.
      </p>

      <button className="mt-6 inline-flex h-[52px] min-h-0 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-none transition-colors hover:bg-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={() => router.push("/welcome")} type="button">
        Continuar
      </button>

      <button className="mt-3 inline-flex min-h-11 items-center justify-center px-3 text-sm font-semibold text-primary transition-colors hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={() => router.replace("/login")} type="button">
        Voltar ao login
      </button>

      <p className="mt-auto pt-12 text-center text-xs leading-5 text-muted-foreground">
        Mais que um sistema.<br />Um aliado no seu dia a dia.
      </p>
    </section>
  );
}
