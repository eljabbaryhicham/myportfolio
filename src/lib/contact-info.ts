'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { initializeServerApp } from '@/firebase/server-init';
import type { ContactInfo } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Server-side fetcher for the public `contact/details` document, used as the
 * SSR seed for the shared ContactInfoProvider. Returns `null` on any failure
 * (missing credentials, no document, network) so the client can fall back to
 * its own `useDoc` subscription — preserving the previous fallback behavior.
 *
 * Mirrors the client `useDoc` hook shape (`ContactInfo & { id: string }`) so
 * consumers receive the exact same value whether it comes from the server seed
 * or the live subscription.
 *
 * Wrapped in React's `cache()` so multiple consumers in the same request share
 * a single Firestore read. The outer `unstable_cache` additionally prevents
 * each visitor request from becoming another Firestore document read.
 */
const readContactInfo = async (): Promise<(ContactInfo & { id: string }) | null> => {
  try {
    const app = await initializeServerApp();
    const snap = await app.firestore().doc('contact/details').get();
    if (!snap.exists) return null;
    return { ...(snap.data() as ContactInfo), id: snap.id };
  } catch (e) {
    logger.warn('getContactInfo: failed to read contact/details on the server', e);
    return null;
  }
};

const getCachedContactInfo = unstable_cache(
  readContactInfo,
  ['contact-info-v1'],
  { revalidate: 300, tags: ['contact-details'] }
);

export const getContactInfo = cache(getCachedContactInfo);