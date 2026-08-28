'use client';

import { createContext, useContext } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { HomePageSettings } from '@/lib/types';

interface HomePageSettingsContextValue {
  /** The resolved settings, or null while still loading on the client. */
  settings: HomePageSettings | null;
  /** True until the first client snapshot resolves; seeded false by SSR. */
  isLoading: boolean;
}

const HomePageSettingsContext = createContext<HomePageSettingsContextValue | null>(null);

export { HomePageSettingsContext };

/**
 * Provides the public homepage/settings document to the React tree.
 *
 * The provider is seeded with the server-fetched value (`initialSettings`)
 * so the very first render — and therefore the SSR HTML — already contains
 * the admin-configured values, eliminating the FOUC flash on load. After
 * mount, a `useDoc` subscription keeps the value live, so admin edits made
 * while the public site is open still reflect without a hard refresh.
 *
 * Server-side rendering note: `useDoc` initializes with `isLoading=true`
 * (per its hook contract), but we suppress the loading state on the first
 * client render whenever we already have a server-seeded value, so the UI
 * does not flicker back to a loading/empty state during hydration.
 */
export function HomePageSettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: HomePageSettings | null;
  children: React.ReactNode;
}) {
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data, isLoading } = useDoc<HomePageSettings>(settingsDocRef);

  // Once the client subscription yields a value (which is at minimum the
  // same as initialSettings, but may be fresher if the admin edited between
  // the SSR and the client mount), prefer it; otherwise keep the SSR seed.
  const settings = data ?? initialSettings ?? null;
  // Treat the page as "loaded" if we have either the live snapshot OR the
  // server-seeded value. This prevents a brief isLoading flash right after
  // hydration when initialSettings is already present.
  const effectivelyLoading = isLoading && !settings;

  return (
    <HomePageSettingsContext.Provider value={{ settings, isLoading: effectivelyLoading }}>
      {children}
    </HomePageSettingsContext.Provider>
  );
}

export function useHomePageSettings(): HomePageSettingsContextValue {
  const ctx = useContext(HomePageSettingsContext);
  if (!ctx) {
    throw new Error('useHomePageSettings must be used within a HomePageSettingsProvider');
  }
  return ctx;
}
