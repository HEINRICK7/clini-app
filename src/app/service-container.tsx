"use client";

import { createContext, useContext, type ReactNode } from "react";

import { cliniServices, type CliniServices } from "./services";

const ServicesContext = createContext<CliniServices | null>(null);

export function CliniServicesProvider({
  children,
  services = cliniServices,
}: Readonly<{ children: ReactNode; services?: CliniServices }>) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useCliniServices() {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("useCliniServices precisa estar dentro de CliniServicesProvider.");
  return services;
}
