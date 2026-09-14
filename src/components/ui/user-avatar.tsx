import { cn } from "@/lib/utils";

export const cliniAvatarPalette = [
  "var(--avatar-navy)",
  "var(--avatar-cyan)",
  "var(--avatar-primary)",
  "var(--avatar-light-blue)",
  "var(--avatar-soft-cyan)",
] as const;

type UserAvatarProps = Readonly<{
  name: string;
  seed?: string;
  size?: "xs" | "sm" | "md" | "lg";
  decorative?: boolean;
}>;

const sizeClasses = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
} as const;

function hashSeed(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick(hash: number, offset: number) {
  return cliniAvatarPalette[(hash + offset) % cliniAvatarPalette.length];
}

export function UserAvatar({ name, seed, size = "md", decorative = false }: UserAvatarProps) {
  const stableSeed = seed?.trim() || name.trim() || "clini-user";
  const hash = hashSeed(stableSeed);
  const background = pick(hash, 0);
  const face = pick(hash, 1);
  const accent = pick(hash, 2);
  const eyeOffset = 42 + (hash % 8);
  const tilt = (hash % 5) - 2;
  const label = `${name || "Usuário"} — avatar`;

  return (
    <svg
      aria-hidden={decorative}
      aria-label={decorative ? undefined : label}
      className={cn(sizeClasses[size], "shrink-0 overflow-hidden rounded-full border border-border")}
      role={decorative ? "presentation" : "img"}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" fill={background} r="49" />
      <g transform={`rotate(${tilt} 50 50)`}>
        <path d="M15 100c2-23 16-37 35-37s33 14 35 37H15Z" fill={face} />
        <path d="M25 47c0-20 10-31 25-31 17 0 26 12 26 31 0 14-10 25-26 25S25 61 25 47Z" fill={accent} />
        <path d="M27 42c4-17 13-24 25-24 12 0 21 7 25 24-8-5-16-8-25-8s-17 3-25 8Z" fill={face} />
        <circle cx="39" cy={eyeOffset} fill="var(--avatar-ink)" r="3.3" />
        <circle cx="61" cy={eyeOffset - 1} fill="var(--avatar-ink)" r="3.3" />
        <path d="M42 59c5 4 11 4 16 0" fill="none" stroke="var(--avatar-ink)" strokeLinecap="round" strokeWidth="3" />
        <path d="M15 95c12-7 22-10 35-10s23 3 35 10v5H15Z" fill={pick(hash, 3)} opacity=".88" />
      </g>
    </svg>
  );
}
