'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface HomeReadyContextValue {
  ready: boolean;
  notifyReady: () => void;
}

const HomeReadyContext = createContext<HomeReadyContextValue | null>(null);

export function HomeReadyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const notifyReady = useCallback(() => setReady(true), []);
  const value = useMemo(() => ({ ready, notifyReady }), [ready, notifyReady]);
  return <HomeReadyContext.Provider value={value}>{children}</HomeReadyContext.Provider>;
}

export function useHomeReady(): HomeReadyContextValue {
  const ctx = useContext(HomeReadyContext);
  if (!ctx) throw new Error('useHomeReady must be used within HomeReadyProvider');
  return ctx;
}
