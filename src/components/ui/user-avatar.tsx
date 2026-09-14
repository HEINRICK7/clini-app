import Avatar from "boring-avatars";

import { cn } from "@/lib/utils";

/** Paleta oficial do CLINI, em ordem de prioridade para o Boring Avatars. */
export const cliniAvatarPalette = [
  "#0b2d5b", // brand-navy
  "#00c2e8", // brand-cyan
  "#2563eb", // primary
  "#dbeafe", // primary em tom claro
  "#cffafe", // brand-cyan em tom claro
] as string[];

type UserAvatarProps = Readonly<{
  name: string;
  seed?: string;
  size?: "xs" | "sm" | "md" | "lg";
  decorative?: boolean;
}>;

const sizePixels = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
} as const;

/**
 * Wrapper do pacote oficial. O Boring Avatars usa `name` como seed determinística;
 * a API `seed` existe para que os consumidores prefiram id e mantenham o nome visível.
 */
export function UserAvatar({ name, seed, size = "md", decorative = false }: UserAvatarProps) {
  const avatarSeed = seed?.trim() || name.trim() || "clini-user";
  const label = `${name || "Usuário"} — avatar`;

  return (
    <Avatar
      aria-hidden={decorative}
      aria-label={decorative ? undefined : label}
      className={cn("shrink-0 rounded-full border border-border", {
        "h-6 w-6": size === "xs",
        "h-8 w-8": size === "sm",
        "h-10 w-10": size === "md",
        "h-14 w-14": size === "lg",
      })}
      colors={cliniAvatarPalette}
      name={avatarSeed}
      role={decorative ? "presentation" : "img"}
      size={sizePixels[size]}
      variant="beam"
    />
  );
}
