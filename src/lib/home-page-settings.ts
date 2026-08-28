'use server';

import { cache } from 'react';
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
export const getHomePageSettings = cache(async (): Promise<HomePageSettings | null> => {
  try {
    const app = await initializeServerApp();
    const snap = await app.firestore().doc('homepage/settings').get();
    if (!snap.exists) return null;
    return snap.data() as HomePageSettings;
  } catch (e) {
    logger.warn('getHomePageSettings: failed to read homepage/settings on the server', e);
    return null;
  }
});
