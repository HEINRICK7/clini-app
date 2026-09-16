"use client";

import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import { authGateway } from "@/modules/auth/infrastructure/auth-gateway";

export function ActivationScreen({ token }: Readonly<{ token: string }>) {
  const router = useRouter();
  const invitationQuery = useQuery({
    queryKey: ["owner-invitation", token],
    queryFn: () => authGateway.getInvitationDetails(token),
    retry: false,
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loadedAt] = useState(() => Date.now());
  const activateMutation = useMutation({
    mutationFn: () => authGateway.activateInvitation(token, { password, confirmPassword, termsAccepted }),
    onSuccess: () => {
      router.replace("/welcome");
      router.refresh();
    },
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    activateMutation.mutate();
  }

  if (invitationQuery.isPending) {
    return <ActivationState message="Validando seu convite…" />;
  }

  if (invitationQuery.isError || !invitationQuery.data) {
    return <ActivationError error={invitationQuery.error} onBack={() => router.replace("/login")} />;
  }

  const invitation = invitationQuery.data;
  const validityHours = Math.max(1, Math.ceil((new Date(invitation.expiresAt).getTime() - loadedAt) / 3_600_000));
  const passwordsMatch = password === confirmPassword;
  const hasPasswordMismatch = confirmPassword.length > 0 && !passwordsMatch;
  const canSubmit = password.length >= 8 && confirmPassword.length >= 8 && passwordsMatch && termsAccepted && !activateMutation.isPending;

  return (
    <section aria-labelledby="activation-title" className="flex min-h-[100dvh] w-full max-w-3xl flex-col bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-[calc(env(safe-area-inset-top)+2rem)] sm:px-10 lg:px-12">
      <button aria-label="Voltar para o login" className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-slate-600 transition-colors hover:bg-blue-50 hover:text-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={() => router.replace("/login")} type="button">
        <ArrowLeft aria-hidden="true" className="h-8 w-8" strokeWidth={2.2} />
      </button>

      <div className="mt-8 flex justify-center sm:mt-10">
        <Image alt="Clini" className="h-auto w-52 sm:w-64" height={1254} priority src="/icon-sem-slogan.png" width={1254} />
      </div>

      <header className="mt-10 text-center sm:mt-12">
        <h1 className="text-[clamp(2.25rem,7vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.04em] text-brand-navy" id="activation-title">Seu acesso ao Clini<br />está pronto</h1>
        <p className="clini-subtitle mt-5 text-lg leading-8 text-slate-500 sm:text-2xl">Ative sua conta para começar a usar o sistema.</p>
      </header>

      <div className="mt-10 flex flex-col gap-6 rounded-[1.75rem] bg-blue-50 px-7 py-7 sm:flex-row sm:items-start sm:justify-between sm:px-9 sm:py-8">
        <div>
          <h2 className="text-2xl font-extrabold leading-tight tracking-[-0.03em] text-brand-navy sm:text-3xl">Olá, {invitation.name}</h2>
          <p className="mt-3 max-w-md text-lg leading-8 text-slate-600 sm:text-xl">Sua conta foi preparada pela equipe do Clini. É só ativar para começar a usar.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-success/10 px-6 py-3 text-base font-extrabold text-success sm:mt-1 sm:text-lg"><span aria-hidden="true" className="h-3 w-3 rounded-full bg-success" />Convite preparado</span>
      </div>

      <form className="mt-10 grid min-w-0 grid-cols-1 gap-7" onSubmit={submit}>
        <ReadonlyField email={invitation.email} />
        <PasswordField id="activation-password" label="Crie sua senha" onChange={setPassword} onToggle={() => setShowPassword((current) => !current)} showPassword={showPassword} value={password} />
        <div>
          <PasswordField id="activation-confirm-password" label="Confirmar senha" onChange={setConfirmPassword} onToggle={() => setShowConfirmation((current) => !current)} showPassword={showConfirmation} value={confirmPassword} />
          {hasPasswordMismatch ? <p className="mt-2 text-sm font-semibold text-danger" id="activation-password-mismatch">As senhas precisam ser iguais.</p> : null}
        </div>

        <label className="flex cursor-pointer items-center gap-5 text-lg text-slate-600 sm:text-2xl">
          <input aria-label="Aceitar os termos" checked={termsAccepted} className="h-12 w-12 shrink-0 cursor-pointer rounded-xl border-4 border-slate-400 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onChange={(event) => setTermsAccepted(event.target.checked)} type="checkbox" />
          <span>Li e aceito os <span className="font-semibold text-primary">termos</span></span>
        </label>

        {activateMutation.isError ? <p aria-live="polite" className="rounded-2xl border border-danger/30 bg-danger/10 px-5 py-4 text-base font-semibold leading-6 text-danger" role="alert">{activationErrorMessage(activateMutation.error)}</p> : null}

        <button className="inline-flex h-[74px] min-h-0 min-w-0 w-full items-center justify-center gap-5 rounded-3xl bg-primary px-6 text-xl font-extrabold text-primary-foreground shadow-sm transition-colors hover:bg-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 sm:text-2xl" disabled={!canSubmit} type="submit">
          {activateMutation.isPending ? <LoaderCircle aria-hidden="true" className="h-7 w-7 animate-spin" /> : null}
          {activateMutation.isPending ? "Ativando…" : "Ativar meu Clini"}
          {!activateMutation.isPending ? <ArrowRight aria-hidden="true" className="h-8 w-8" strokeWidth={2.3} /> : null}
        </button>
      </form>

      <p className="mt-6 text-center text-lg text-slate-500 sm:text-xl">Convite válido por {validityHours} {validityHours === 1 ? "hora" : "horas"}</p>
      <p className="mt-7 border-t border-slate-200 pt-7 text-center text-lg font-medium text-primary sm:text-xl">Precisa de ajuda? Fale com o suporte</p>
    </section>
  );
}

function ReadonlyField({ email }: Readonly<{ email: string }>) {
  return <div className="min-w-0"><label className="mb-3 block text-lg font-extrabold text-brand-navy sm:text-2xl" htmlFor="activation-email">E-mail</label><div className="flex h-[74px] min-w-0 w-full items-center justify-between gap-4 overflow-hidden rounded-2xl border-2 border-border bg-surface-muted px-6 text-lg text-slate-600 sm:text-2xl"><input aria-label="E-mail do convite" className="min-w-0 flex-1 bg-transparent outline-none" id="activation-email" readOnly type="email" value={email} /><span className="shrink-0 text-base text-slate-400 sm:text-xl">Somente leitura</span></div></div>;
}

function PasswordField({ id, label, onChange, onToggle, showPassword, value }: Readonly<{ id: string; label: string; onChange: (value: string) => void; onToggle: () => void; showPassword: boolean; value: string }>) {
  const accessibleName = label === "Confirmar senha" ? "senha de confirmação" : "senha";
  return <div className="min-w-0"><label className="mb-3 block text-lg font-extrabold text-brand-navy sm:text-2xl" htmlFor={id}>{label}</label><div className="relative min-w-0"><input autoComplete="new-password" className="h-[74px] w-full rounded-2xl border-2 border-border bg-surface px-6 pr-16 text-lg text-brand-navy outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:text-2xl" id={id} minLength={8} onChange={(event) => onChange(event.target.value)} placeholder="••••••••••" required type={showPassword ? "text" : "password"} value={value} /><button aria-label={showPassword ? `Ocultar ${accessibleName}` : `Mostrar ${accessibleName}`} className="absolute right-2 top-1/2 inline-flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary" onClick={onToggle} type="button">{showPassword ? <EyeOff aria-hidden="true" className="h-7 w-7" /> : <Eye aria-hidden="true" className="h-7 w-7" />}</button></div></div>;
}

function ActivationState({ message }: Readonly<{ message: string }>) {
  return <section aria-live="polite" className="flex min-h-[100dvh] w-full max-w-3xl flex-col items-center justify-center bg-surface px-5 text-center"><Image alt="Clini" className="h-auto w-52" height={1254} priority src="/icon-sem-slogan.png" width={1254} /><LoaderCircle aria-hidden="true" className="mt-12 h-8 w-8 animate-spin text-primary" /><p className="mt-5 text-lg font-semibold text-slate-500">{message}</p></section>;
}

function ActivationError({ error, onBack }: Readonly<{ error: Error | null; onBack: () => void }>) {
  return <section aria-labelledby="activation-error-title" className="flex min-h-[100dvh] w-full max-w-3xl flex-col items-center justify-center bg-surface px-5 text-center"><Image alt="Clini" className="h-auto w-52" height={1254} priority src="/icon-sem-slogan.png" width={1254} /><h1 className="mt-12 text-3xl font-extrabold tracking-tight text-brand-navy" id="activation-error-title">Este convite não está disponível</h1><p className="mt-4 max-w-md text-lg leading-7 text-slate-500">{activationErrorMessage(error)}</p><button className="mt-8 inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-8 text-base font-extrabold text-primary-foreground hover:bg-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" onClick={onBack} type="button">Voltar para o login</button></section>;
}

function activationErrorMessage(error: Error | null) {
  if (error instanceof ApiError) return error.message;
  return "Não foi possível validar este convite. Solicite um novo link ao suporte.";
}
