'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { initializeServerApp } from '@/firebase/server-init';
import type { MultilingualString } from '@/lib/i18n/multilingual';
import { logger } from '@/lib/logger';

export interface AboutPageContent {
  title: MultilingualString;
  content: MultilingualString;
  imageUrl: string;
  logoUrl?: string;
  logoScale?: number;
}

/**
 * Server-side fetcher for the public `about/content` document, used as the
 * SSR seed for the About page. Returns `null` on any failure so the client can
 * fall back to its own `useDoc` subscription.
 *
 * Mirrors the client `useDoc` hook shape (`AboutPageContent & { id: string }`).
 * Wrapped in React's `cache()` so multiple consumers in the same request share
 * one Firestore read; the outer `unstable_cache` prevents per-visitor reads.
 */
const readAboutContent = async (): Promise<(AboutPageContent & { id: string }) | null> => {
  try {
    const app = await initializeServerApp();
    const snap = await app.firestore().doc('about/content').get();
    if (!snap.exists) return null;
    return { ...(snap.data() as AboutPageContent), id: snap.id };
  } catch (e) {
    logger.warn('getAboutContent: failed to read about/content on the server', e);
    return null;
  }
};

const getCachedAboutContent = unstable_cache(
  readAboutContent,
  ['about-content-v1'],
  { revalidate: 300, tags: ['about-content'] }
);

export const getAboutContent = cache(getCachedAboutContent);