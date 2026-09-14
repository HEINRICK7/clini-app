import Image from "next/image";

export function SplashScreen() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-surface px-5 py-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <div className="relative z-10 flex w-full max-w-sm -translate-y-14 items-center justify-center pb-16">
        <Image alt="Clini — Cuidando de sorrisos. Simplificando o seu dia." className="h-auto w-[13.75rem] object-contain" height={1402} priority src="/icon-slogan.png" width={1122} />
      </div>
      <svg aria-hidden="true" className="absolute bottom-0 left-0 h-[21%] min-h-36 max-h-48 w-full" preserveAspectRatio="none" viewBox="0 0 600 320">
        <path d="M0 96C105 57 176 118 280 139C398 162 492 125 600 76V320H0Z" fill="var(--primary)" />
      </svg>
    </main>
  );
}
