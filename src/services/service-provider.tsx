import React, { createContext, useContext, type ReactNode } from 'react';
import type { MarketplaceService } from './marketplace-service';

type ServicesContextValue = {
  marketplaceService: MarketplaceService;
};

const ServicesContext = createContext<ServicesContextValue | undefined>(undefined);

export function ServiceProvider({
  children,
  marketplaceService,
}: {
  children: ReactNode;
  marketplaceService: MarketplaceService;
}) {
  return (
    <ServicesContext.Provider value={{ marketplaceService }}>
      {children}
    </ServicesContext.Provider>
  );
}

export function useServices() {
  const ctx = useContext(ServicesContext);
  if (!ctx) {
    throw new Error('useServices must be used inside ServiceProvider');
  }
  return ctx;
}
