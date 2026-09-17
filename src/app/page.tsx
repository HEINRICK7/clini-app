"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OperationalShell } from "@/app/operational-shell";
import { useCliniServices } from "@/app/service-container";
import { SplashScreen } from "@/components/brand/splash-screen";
import { isUnauthorized } from "@/lib/error-policy";
import { DashboardWorkspace } from "@/modules/dashboard/components/dashboard-workspace";

export default function Home() {
  const router = useRouter();
  const { auth } = useCliniServices();
  const sessionQuery = useQuery({ queryKey: ["auth-session"], queryFn: auth.getCurrentSession, retry: false });
  const unauthorized = isUnauthorized(sessionQuery.error);

  useEffect(() => {
    if (!unauthorized || sessionQuery.isFetching) return;

    const timeoutId = window.setTimeout(() => router.replace("/login"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [router, sessionQuery.isFetching, unauthorized]);

  if (sessionQuery.data || (sessionQuery.isError && !unauthorized)) {
    return <OperationalShell><DashboardWorkspace /></OperationalShell>;
  }

  return <SplashScreen />;
}
