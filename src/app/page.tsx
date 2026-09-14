"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OperationalShell } from "@/app/operational-shell";
import { SplashScreen } from "@/components/brand/splash-screen";
import { ApiError } from "@/lib/api/client";
import { getCurrentSession } from "@/modules/auth/api";
import { DashboardWorkspace } from "@/modules/dashboard/components/dashboard-workspace";

export default function Home() {
  const router = useRouter();
  const sessionQuery = useQuery({ queryKey: ["auth-session"], queryFn: getCurrentSession, retry: false });
  const isUnauthorized = sessionQuery.error instanceof ApiError && sessionQuery.error.status === 401;

  useEffect(() => {
    if (!isUnauthorized || sessionQuery.isFetching) return;

    const timeoutId = window.setTimeout(() => router.replace("/login"), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [isUnauthorized, router, sessionQuery.isFetching]);

  if (sessionQuery.data || (sessionQuery.isError && !isUnauthorized)) {
    return <OperationalShell><DashboardWorkspace /></OperationalShell>;
  }

  return <SplashScreen />;
}
