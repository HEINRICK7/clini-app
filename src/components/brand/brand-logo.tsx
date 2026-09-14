import Image from "next/image";
import logoPrincipal from "@/assets/brand/clini/logo-principal.png";

type BrandLogoProps = {
  priority?: boolean;
  compact?: boolean;
};

export function BrandLogo({ priority = false, compact = false }: BrandLogoProps) {
  if (compact) return <span aria-label="Clini" className="relative inline-block text-[1.75rem] font-bold leading-none tracking-[-0.08em] text-primary">Clini<span aria-hidden="true" className="absolute -bottom-1 left-[1.08rem] h-1.5 w-7 rounded-b-full border-b-2 border-primary" /></span>;
  return (
    <Image
      alt="clini — gestão para dentistas"
      className="h-14 w-auto object-contain object-left sm:h-16"
      height={220}
      priority={priority}
      src={logoPrincipal}
      width={350}
    />
  );
}
