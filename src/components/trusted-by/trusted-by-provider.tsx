'use client';

import { createContext, useContext, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import type { TrustedByClient } from '@/lib/types';

interface TrustedByContextValue {
  clients: TrustedByClient[] | null;
  /** True until the first live `clients` snapshot resolves. */
  isLoading: boolean;
}

const TrustedByContext = createContext<TrustedByContextValue | null>(null);

export { TrustedByContext };

/**
 * Provides the public `clients` collection to the React tree.
 *
 * Seeded with the server-fetched value (`initialClients`) so the very first
 * render — and therefore the SSR HTML — already contains the client list,
 * eliminating the Firestore round-trip wait that previously delayed the
 * TrustedBy strip.
 *
 * Seed-first: when a server seed is present, the provider uses it WITHOUT
 * opening a client Firestore subscription. The server already read the cached
 * `clients` collection (`getTrustedByClients`) — subscribing again would re-bill
 * the whole collection for every visitor, duplicating that amortized read. A
 * live subscription is only opened as a fallback when there is no seed (e.g.
 * the server read failed), so the page can still load its data.
 */
export function TrustedByProvider({
  initialClients,
  children,
}: {
  initialClients: TrustedByClient[] | null;
  children: React.ReactNode;
}) {
  const firestore = useFirestore();
  const hasSeed = Array.isArray(initialClients);

  const clientsQuery = useMemoFirebase(
    () => (firestore && !hasSeed ? query(collection(firestore, 'clients'), orderBy('order', 'asc')) : null),
    [firestore, hasSeed]
  );
  const { data, isLoading } = useCollection<TrustedByClient>(clientsQuery);

  // Prefer the live snapshot when it resolves (fallback path); otherwise keep
  // the SSR seed so the first paint is never empty.
  const value = useMemo<TrustedByContextValue>(
    () => ({ clients: data ?? initialClients ?? null, isLoading }),
    [data, initialClients, isLoading]
  );

  return <TrustedByContext.Provider value={value}>{children}</TrustedByContext.Provider>;
}

export function useTrustedByClients(): TrustedByContextValue {
  const ctx = useContext(TrustedByContext);
  if (!ctx) throw new Error('useTrustedByClients must be used within TrustedByProvider');
  return ctx;
}
