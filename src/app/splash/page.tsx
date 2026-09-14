"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SplashScreen } from "@/components/brand/splash-screen";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      router.replace("/login");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [router]);

  return <SplashScreen />;
}
