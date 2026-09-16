"use client";

import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError } from "@/lib/api/client";
import { canSubmitNewPassword } from "@/modules/auth/application/password-reset";
import { authGateway } from "@/modules/auth/infrastructure/auth-gateway";

export function PasswordResetRequestScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const mutation = useMutation({ mutationFn: () => authGateway.requestPasswordReset(email) });

  if (mutation.isSuccess) {
    return <MessageState title="Confira seu e-mail" message="Se houver uma conta Clini com este e-mail, enviaremos um link seguro para redefinir sua senha." onBack={() => router.replace("/login")} />;
  }

  return <AuthFrame title="Esqueci minha senha" subtitle="Informe seu e-mail para receber um link seguro de redefinição." onBack={() => router.replace("/login")}>
    <form className="mt-8 grid gap-6" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
      <label className="text-sm font-semibold text-brand-navy" htmlFor="reset-email">E-mail<input autoComplete="email" className="mt-2 h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" id="reset-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
      {mutation.isError ? <ErrorMessage error={mutation.error} /> : null}
      <button className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary-strong disabled:opacity-50" disabled={mutation.isPending} type="submit">{mutation.isPending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}{mutation.isPending ? "Enviando…" : "Enviar link"}<ArrowRight className="h-5 w-5" /></button>
    </form>
  </AuthFrame>;
}

export function PasswordResetScreen({ token }: Readonly<{ token: string }>) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const mutation = useMutation({ mutationFn: () => authGateway.resetPassword({ token, password, confirmPassword }), onSuccess: () => router.replace("/login") });
  const mismatch = confirmPassword.length > 0 && !canSubmitNewPassword(password, confirmPassword) && password !== confirmPassword;

  return <AuthFrame title="Crie uma nova senha" subtitle="Escolha uma senha com pelo menos 8 caracteres." onBack={() => router.replace("/login")}>
    <form className="mt-8 grid gap-6" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
      <PasswordField id="new-password" label="Nova senha" value={password} show={showPassword} onChange={setPassword} onToggle={() => setShowPassword((value) => !value)} />
      <div><PasswordField id="confirm-password" label="Confirmar senha" value={confirmPassword} show={showConfirmation} onChange={setConfirmPassword} onToggle={() => setShowConfirmation((value) => !value)} />{mismatch ? <p className="mt-2 text-sm font-semibold text-danger">As senhas precisam ser iguais.</p> : null}</div>
      {mutation.isError ? <ErrorMessage error={mutation.error} /> : null}
      <button className="inline-flex h-[52px] items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground hover:bg-primary-strong disabled:opacity-50" disabled={mutation.isPending || !canSubmitNewPassword(password, confirmPassword)} type="submit">{mutation.isPending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}{mutation.isPending ? "Salvando…" : "Salvar nova senha"}<ArrowRight className="h-5 w-5" /></button>
    </form>
  </AuthFrame>;
}

function AuthFrame({ title, subtitle, onBack, children }: Readonly<{ title: string; subtitle: string; onBack: () => void; children: React.ReactNode }>) {
  return <section className="flex min-h-[100dvh] w-full max-w-[22rem] flex-col bg-surface px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]"><button aria-label="Voltar" className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-brand-navy hover:bg-surface-muted" onClick={onBack} type="button"><ArrowLeft className="h-[22px] w-[22px]" /></button><div className="mt-1 flex justify-center"><Image alt="Clini" className="h-auto w-[4.5rem]" height={1254} priority src="/icon-sem-slogan.png" width={1254} /></div><header className="mt-6"><h1 className="text-2xl font-bold leading-[1.2] tracking-tight text-brand-navy">{title}</h1><p className="mt-1 text-sm leading-6 text-muted-foreground">{subtitle}</p></header>{children}</section>;
}

function MessageState({ title, message, onBack }: Readonly<{ title: string; message: string; onBack: () => void }>) {
  return <AuthFrame title={title} subtitle={message} onBack={onBack}><button className="mt-8 h-[52px] rounded-xl bg-primary font-semibold text-primary-foreground" onClick={onBack} type="button">Voltar para o login</button></AuthFrame>;
}

function PasswordField({ id, label, value, show, onChange, onToggle }: Readonly<{ id: string; label: string; value: string; show: boolean; onChange: (value: string) => void; onToggle: () => void }>) {
  return <label className="text-sm font-semibold text-brand-navy" htmlFor={id}>{label}<span className="relative mt-2 block"><input autoComplete="new-password" className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 pr-12 text-base outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" id={id} minLength={8} onChange={(event) => onChange(event.target.value)} required type={show ? "text" : "password"} value={value} /><button aria-label={show ? "Ocultar senha" : "Mostrar senha"} className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 text-muted-foreground" onClick={onToggle} type="button">{show ? <EyeOff className="mx-auto h-4 w-4" /> : <Eye className="mx-auto h-4 w-4" />}</button></span></label>;
}

function ErrorMessage({ error }: Readonly<{ error: Error }>) {
  return <p aria-live="polite" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">{error instanceof ApiError ? error.message : "Não foi possível concluir a operação."}</p>;
}
