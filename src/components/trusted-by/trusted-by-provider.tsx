'use client';

import { createContext, useContext, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import type { TrustedByClient } from '@/lib/types';

interface TrustedByContextValue {
  clients: TrustedByClient[] | null;
  /** True until the first live `clients` snapshot resolves. */
  isLoading: boolean;
  /** Non-null when the client read failed (e.g. quota/permissions). */
  error: Error | null;
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
 * The server seed prevents a loading flash on first paint. A client Firestore
 * subscription then keeps the value current when an admin saves a change.
 */
export function TrustedByProvider({
  initialClients,
  children,
}: {
  initialClients: TrustedByClient[] | null;
  children: React.ReactNode;
}) {
  const firestore = useFirestore();
  const clientsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'clients'), orderBy('order', 'asc')) : null),
    [firestore]
  );
  const { data, isLoading, error } = useCollection<TrustedByClient>(clientsQuery);

  // Prefer the live snapshot when it resolves; otherwise keep the SSR seed so
  // the first paint is never empty.
  const value = useMemo<TrustedByContextValue>(
    () => {
      const clients = data ?? initialClients ?? null;
      return { clients, isLoading: isLoading && !clients, error };
    },
    [data, initialClients, isLoading, error]
  );

  return <TrustedByContext.Provider value={value}>{children}</TrustedByContext.Provider>;
}

export function useTrustedByClients(): TrustedByContextValue {
  const ctx = useContext(TrustedByContext);
  if (!ctx) throw new Error('useTrustedByClients must be used within TrustedByProvider');
  return ctx;
}
