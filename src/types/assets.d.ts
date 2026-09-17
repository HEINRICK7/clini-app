import type { StaticImageData } from "next/image";

declare module "*.png" {
  const source: StaticImageData;
  export default source;
}
