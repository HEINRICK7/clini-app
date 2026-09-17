"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";
import { CliniServicesProvider } from "./service-container";

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CliniServicesProvider>
        <ServiceWorkerRegistration />
        {children}
      </CliniServicesProvider>
    </QueryClientProvider>
  );
}
