import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "clini",
  description: "Gestão profissional para dentistas",
  applicationName: "Clini",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Clini",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
