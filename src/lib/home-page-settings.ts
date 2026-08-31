'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { initializeServerApp } from '@/firebase/server-init';
import type { HomePageSettings } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Server-side fetcher for the public homepage/settings document.
 * Returns `null` on any failure (missing credentials, no document, network)
 * so the page can still render with the built-in defaults via the client
 * `useDoc` subscription — preserving the previous fallback behavior.
 *
 * Wrapped in React's `cache()` so multiple consumers in the same request
 * share a single Firestore read.
 */
const readHomePageSettings = async (): Promise<HomePageSettings | null> => {
  try {
    const app = await initializeServerApp();
    const snap = await app.firestore().doc('homepage/settings').get();
    if (!snap.exists) return null;
    return snap.data() as HomePageSettings;
  } catch (e) {
    logger.warn('getHomePageSettings: failed to read homepage/settings on the server', e);
    return null;
  }
};

// Public settings are read by the root layout, metadata, and OG image. React's
// cache() only deduplicates those calls within one render; this cache also
// prevents each visitor request from becoming another Firestore document read.
const getCachedHomePageSettings = unstable_cache(
  readHomePageSettings,
  ['homepage-settings-v1'],
  { revalidate: 300, tags: ['homepage-settings'] }
);

export const getHomePageSettings = cache(getCachedHomePageSettings);
