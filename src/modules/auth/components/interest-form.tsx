"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { submitCommercialLead } from "@/modules/auth/api";

export function InterestForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await submitCommercialLead({ name, email, whatsapp, city: city || undefined, message: message || undefined });
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Não foi possível enviar seus dados agora. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="interest-title"
      className="flex min-h-[100dvh] w-full max-w-md flex-col bg-surface px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-8"
    >
      <button
        aria-label="Voltar para o login"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-brand-navy transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => router.replace("/login")}
        type="button"
      >
        <ArrowLeft aria-hidden="true" className="h-[22px] w-[22px]" />
      </button>

      <div className="mt-1 flex justify-center">
        <Image alt="Clini" className="h-auto w-[4.5rem]" height={1254} priority src="/icon-sem-slogan.png" width={1254} />
      </div>

      {submitted ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-50 text-primary">
            <CheckCircle2 aria-hidden="true" className="h-11 w-11" strokeWidth={1.8} />
          </div>
          <h1 className="mt-7 text-2xl font-extrabold leading-[1.15] tracking-tight text-brand-navy" id="interest-title">Recebemos seus dados</h1>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">Nossa equipe vai falar com você pelo WhatsApp para apresentar o Clini e combinar os próximos passos.</p>
          <Button className="mt-8 h-[52px] min-h-0 w-full rounded-xl" onClick={() => router.replace("/login")}>Voltar para o login</Button>
        </div>
      ) : (
        <>
          <header className="mt-8">
            <h1 className="text-2xl font-extrabold leading-[1.15] tracking-tight text-brand-navy" id="interest-title">Quero conhecer o Clini</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Envie seus dados. Nossa equipe conversa com você antes de criar qualquer acesso.</p>
          </header>

          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm font-extrabold text-brand-navy" htmlFor="interest-name">Nome completo
              <input autoComplete="name" className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-base font-normal text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10" id="interest-name" onChange={(event) => setName(event.target.value)} placeholder="Dr. Carlos Silva" required value={name} />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-brand-navy" htmlFor="interest-email">E-mail
              <input autoComplete="email" className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-base font-normal text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10" id="interest-email" onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" required type="email" value={email} />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-brand-navy" htmlFor="interest-whatsapp">WhatsApp
              <input autoComplete="tel" className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-base font-normal text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10" id="interest-whatsapp" inputMode="tel" onChange={(event) => setWhatsapp(event.target.value)} placeholder="(86) 99999-9999" required value={whatsapp} />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-brand-navy" htmlFor="interest-city">Cidade <span className="font-semibold text-muted-foreground">(opcional)</span>
              <input autoComplete="address-level2" className="h-[52px] w-full rounded-xl border border-border bg-surface px-4 text-base font-normal text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10" id="interest-city" onChange={(event) => setCity(event.target.value)} placeholder="Piripiri - PI" value={city} />
            </label>
            <label className="grid gap-2 text-sm font-extrabold text-brand-navy" htmlFor="interest-message">Como podemos ajudar? <span className="font-semibold text-muted-foreground">(opcional)</span>
              <textarea className="min-h-24 w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-base font-normal text-foreground outline-none transition placeholder:text-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10" id="interest-message" onChange={(event) => setMessage(event.target.value)} placeholder="Conte um pouco sobre seu consultório..." value={message} />
            </label>
            {errorMessage ? <p aria-live="polite" className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm leading-5 text-danger" role="alert">{errorMessage}</p> : null}
            <Button className="h-[52px] min-h-0 w-full rounded-xl" disabled={isSubmitting} type="submit">{isSubmitting ? "Enviando…" : "Enviar meus dados"}</Button>
          </form>

          <p className="mt-auto pt-8 text-center text-xs leading-5 text-muted-foreground">Você não cria uma conta agora. Primeiro conversamos para entender se o Clini faz sentido para você.</p>
        </>
      )}
    </section>
  );
}
