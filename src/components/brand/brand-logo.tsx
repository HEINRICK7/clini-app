import Image from "next/image";
import logoHorizontal from "@/assets/brand/clini/logo-horizontal.png";
import logoPrincipal from "@/assets/brand/clini/logo-principal.png";

type BrandLogoProps = {
  priority?: boolean;
  compact?: boolean;
};

export function BrandLogo({ priority = false, compact = false }: BrandLogoProps) {
  if (compact) {
    return <Image alt="Clini" className="h-11 w-auto object-contain object-left sm:h-12" height={220} priority={priority} src={logoHorizontal} width={370} />;
  }
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
