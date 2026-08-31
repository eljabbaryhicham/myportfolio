'use client';

import { createContext, useContext, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';

interface PortfolioItemsContextValue {
  /** The resolved projects, or null while still loading on the client. */
  items: PortfolioItem[] | null;
  /** True until the first client snapshot resolves; seeded false by SSR. */
  isLoading: boolean;
  /** True once the value comes from a live Firestore snapshot (not the SSR seed). */
  hasLiveData: boolean;
}

const PortfolioItemsContext = createContext<PortfolioItemsContextValue | null>(null);

export { PortfolioItemsContext };

/**
 * Provides the public `projects` collection to the /work tree.
 *
 * Seeded with the server-fetched value (`initialItems`) so the very first
 * render — and therefore the SSR HTML — already contains the project grid,
 * eliminating the Firestore round-trip wait that previously delayed the /work
 * grid.
 *
 * Seed-first: when a server seed is present, the provider uses it WITHOUT
 * opening a client Firestore subscription. The server already read the cached
 * `projects` collection (`getPortfolioItems`) — subscribing again would re-bill
 * the whole collection for every visitor, duplicating that amortized read. A
 * live subscription is only opened as a fallback when there is no seed (e.g.
 * the server read failed), so the grid can still load its data.
 *
 * Mirrors HomePageSettingsProvider's loading suppression: whenever a
 * server-seeded value is already present, the first client render is treated as
 * loaded so the UI does not flicker back to a loading state during hydration.
 */
export function PortfolioItemsProvider({
  initialItems,
  children,
}: {
  initialItems: PortfolioItem[] | null;
  children: React.ReactNode;
}) {
  const firestore = useFirestore();
  const hasSeed = Array.isArray(initialItems);

  const projectsQuery = useMemoFirebase(
    () => (firestore && !hasSeed ? collection(firestore, 'projects') : null),
    [firestore, hasSeed]
  );
  const { data, isLoading } = useCollection<PortfolioItem>(projectsQuery);

  // Once the live client snapshot yields a value (fallback path — may be
  // fresher than the seed), prefer it; otherwise keep the SSR seed so the grid
  // is never empty.
  const items = data ?? initialItems ?? null;
  // Treat as "loaded" if we have either the live snapshot OR the server-seeded
  // value, so no loading flash occurs right after hydration when the seed exists.
  const effectivelyLoading = isLoading && !items;

  return (
    <PortfolioItemsContext.Provider
      value={{ items, isLoading: effectivelyLoading, hasLiveData: data !== null }}
    >
      {children}
    </PortfolioItemsContext.Provider>
  );
}

export function usePortfolioItems(): PortfolioItemsContextValue {
  const ctx = useContext(PortfolioItemsContext);
  if (!ctx) {
    throw new Error('usePortfolioItems must be used within a PortfolioItemsProvider');
  }
  return ctx;
}
