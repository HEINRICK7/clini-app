"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CreateAccountForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/account-created");
  }

  return (
    <section
      aria-labelledby="create-account-title"
      className="flex min-h-[100dvh] w-full max-w-md flex-col bg-surface px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-8"
    >
      <button
        aria-label="Voltar para o login"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-navy transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => router.replace("/login")}
        type="button"
      >
        <ArrowLeft aria-hidden="true" className="h-[22px] w-[22px]" />
      </button>

      <div className="mt-2 flex justify-center">
        <Image alt="Clini" className="h-auto w-20" height={1254} src="/icon-sem-slogan.png" width={1254} />
      </div>

      <header className="mt-5">
        <h1 className="text-2xl font-bold leading-[1.2] tracking-tight text-brand-navy" id="create-account-title">
          Crie sua conta
        </h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Comece configurando seu acesso ao Clini.</p>
      </header>

      <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-navy" htmlFor="full-name">
            Nome completo
          </label>
          <input
            autoComplete="name"
            className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
            id="full-name"
            name="fullName"
            placeholder="Dra. Letícia Silva"
            required
            type="text"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-navy" htmlFor="create-email">
            E-mail
          </label>
          <input
            autoComplete="email"
            className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
            id="create-email"
            name="email"
            placeholder="leticia@email.com"
            required
            type="email"
          />
        </div>

        <PasswordField
          id="create-password"
          label="Senha"
          name="password"
          onToggle={() => setShowPassword((current) => !current)}
          placeholder="•••••••••••"
          showPassword={showPassword}
        />

        <PasswordField
          id="confirm-password"
          label="Confirmar senha"
          name="confirmPassword"
          onToggle={() => setShowConfirmation((current) => !current)}
          placeholder="•••••••••••"
          showPassword={showConfirmation}
        />

        <Button className="mt-1 h-[52px] min-h-0 w-full rounded-xl bg-primary shadow-none" type="submit">
          Criar minha conta
        </Button>
      </form>

      <p className="mt-auto pt-10 text-center text-xs leading-5 text-muted-foreground">
        Já possui uma conta?{" "}
        <button className="inline-flex min-h-11 items-center font-semibold text-primary hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={() => router.replace("/login")} type="button">
          Entrar
        </button>
      </p>
    </section>
  );
}

function PasswordField({ id, label, name, onToggle, placeholder, showPassword }: Readonly<{
  id: string;
  label: string;
  name: string;
  onToggle: () => void;
  placeholder: string;
  showPassword: boolean;
}>) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-brand-navy" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          autoComplete="new-password"
          className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 pr-14 text-base text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
          id={id}
          name={name}
          placeholder={placeholder}
          required
          type={showPassword ? "text" : "password"}
        />
        <button
          aria-label={showPassword ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
          onClick={onToggle}
          type="button"
        >
          {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
