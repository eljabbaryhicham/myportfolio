'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { initializeServerApp } from '@/firebase/server-init';
import { getLocalizedString } from '@/lib/i18n/multilingual';
import type { TrustedByClient, MultilingualString } from '@/lib/types';
import { logger } from '@/lib/logger';

interface RawClientDoc {
  name?: MultilingualString;
  logoUrl?: string;
  order?: number;
  isVisible?: boolean;
}

/**
 * Server-side fetcher for the public `clients` collection, used by the
 * homepage TrustedBy strip. Returns the visible clients ordered by `order`
 * (ascending), or `null` on failure so the client can fall back to its own
 * `useCollection` subscription. Wrapped in `cache()` so multiple consumers
 * in the same request share a single Firestore read.
 */
const readTrustedByClients = async (): Promise<TrustedByClient[] | null> => {
  try {
    const app = await initializeServerApp();
    const snap = await app
      .firestore()
      .collection('clients')
      .orderBy('order', 'asc')
      .get();
    const result: TrustedByClient[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as RawClientDoc;
      // Mirror the client-side filter (TrustedBy hides isVisible !== false).
      if (data.isVisible === false) return;
      // Require at least one localized name to render.
      if (!getLocalizedString(data.name, 'en') && !getLocalizedString(data.name, 'fr')) return;
      result.push({
        id: doc.id,
        name: data.name || {},
        logoUrl: data.logoUrl || '',
        order: data.order ?? 0,
        isVisible: data.isVisible,
      });
    });
    return result;
  } catch (e) {
    logger.warn('getTrustedByClients: failed to read clients on the server', e);
    return null;
  }
};

const getCachedTrustedByClients = unstable_cache(
  readTrustedByClients,
  ['trusted-by-clients-v1'],
  { revalidate: 300, tags: ['trusted-by-clients'] }
);

export const getTrustedByClients = cache(getCachedTrustedByClients);
