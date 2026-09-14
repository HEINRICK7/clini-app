"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { login } from "@/modules/auth/api";

const testLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN === "true";
const testEmail = "teste@clini.local";
const testPassword = "CliniTeste@2026!";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(testLoginEnabled ? testEmail : "");
  const [password, setPassword] = useState(testLoginEnabled ? testPassword : "");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!testLoginEnabled) return;
    function handleShortcut(event: KeyboardEvent) {
      if (event.altKey && event.key.toLowerCase() === "t") {
        event.preventDefault();
        setEmail(testEmail);
        setPassword(testPassword);
        setErrorMessage(null);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const session = await login({ email, password });
      router.push(session.units.filter((unit) => unit.status === "ACTIVE").length > 1 ? "/select-unit" : "/");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Não foi possível entrar agora. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="login-title"
      className="flex min-h-[100dvh] w-full max-w-[22rem] flex-col bg-surface px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      <button
        aria-label="Voltar"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => router.back()}
        type="button"
      >
        <ArrowLeft aria-hidden="true" className="h-[22px] w-[22px]" />
      </button>

      <div className="mt-1 flex justify-center">
        <Image alt="Clini" className="h-auto w-[4.5rem]" height={1254} priority src="/icon-sem-slogan.png" width={1254} />
      </div>

      <header className="mt-4">
        <h1 className="text-2xl font-bold leading-[1.2] tracking-tight text-brand-navy" id="login-title">
          Bem-vinda de volta
        </h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Entre para continuar no Clini</p>
      </header>

      <form className="mt-8 grid gap-6" onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-navy" htmlFor="email">
            E-mail
          </label>
          <input
            aria-label="Email"
            autoComplete="email"
            className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-base text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
            id="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu@email.com"
            required
            type="email"
            value={email}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-brand-navy" htmlFor="password">
            Senha
          </label>
          <div className="relative">
            <input
              autoComplete="current-password"
              className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 pr-14 text-base text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-1 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <p aria-live="polite" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button className="h-[52px] min-h-0 w-full rounded-xl bg-primary shadow-none" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>

        <button
          className="block min-h-11 w-full text-center text-sm font-semibold text-primary hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={() => setErrorMessage("Para redefinir sua senha, entre em contato com o administrador.")}
          type="button"
        >
          Esqueci minha senha
        </button>
      </form>

      <p className="mt-auto pt-12 text-center text-xs leading-5 text-muted-foreground">
        Ainda não tem uma conta?{" "}
        <button className="inline-flex min-h-11 items-center font-semibold text-primary hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={() => router.push("/create-account")} type="button">
          Criar minha conta
        </button>
      </p>
    </section>
  );
}
