'use server';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { initializeServerApp } from '@/firebase/server-init';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { getLocalizedString } from '@/lib/i18n/multilingual';
import { slugify } from '@/features/portfolio/components/work-helpers';
import { logger } from '@/lib/logger';

/**
 * Server-side fetcher for the public `projects` collection, used by /work to
 * render the project grid into the SSR HTML on first paint (instead of waiting
 * for the client-side Firestore round-trip after hydration).
 *
 * Returns visible projects ordered by `order` (ascending), or `null` on failure
 * so the client can fall back to its own `useCollection` subscription — the same
 * fallback contract as getHomePageSettings/getTrustedByClients. Wrapped in
 * `cache()` so multiple consumers in the same request share one Firestore read.
 */
const readPortfolioItems = async (): Promise<PortfolioItem[] | null> => {
  try {
    const app = await initializeServerApp();
    const snap = await app.firestore().collection('projects').get();
    const items: PortfolioItem[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as PortfolioItem;
      // Mirror the client-side filter (WorkPageClient hides isVisible !== false).
      if (data.isVisible === false) return;
      items.push({ ...data, id: doc.id });
    });
    // Mirror the client-side ordering (a.order ?? MAX) - (b.order ?? MAX).
    items.sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
    return items;
  } catch (e) {
    logger.warn('getPortfolioItems: failed to read projects on the server', e);
    return null;
  }
};

// Project data is public and also maintained by a live client subscription.
// A five-minute server cache removes the request-time Firestore bottleneck;
// authenticated admin updates can invalidate it immediately through the
// public revalidation endpoint.
const getCachedPortfolioItems = unstable_cache(
  readPortfolioItems,
  ['portfolio-items-v1'],
  { revalidate: 60, tags: ['portfolio-items'] }
);

export const getPortfolioItems = cache(getCachedPortfolioItems);

/**
 * Resolve a shareable `/work?id=<slug>` slug to a single public project.
 *
 * The client deep-link URL is built from the localized title:
 * `slugify(getLocalizedString(item.title, lang))`. Since the sharer's locale
 * isn't known here, match the slug against both the `en` and `fr` titles so a
 * link shared from either locale resolves regardless of the visitor's language.
 */
export const getPortfolioItemBySlug = cache(
  async (slug: string): Promise<PortfolioItem | null> => {
    if (!slug) return null;
    try {
      const items = await getPortfolioItems();
      if (!items) return null;
      return (
        items.find((item) =>
          [getLocalizedString(item.title, 'en'), getLocalizedString(item.title, 'fr')]
            .map((s) => slugify(s))
            .includes(slug)
        ) ?? null
      );
    } catch (e) {
      logger.warn('getPortfolioItemBySlug: failed to resolve slug on the server', e);
      return null;
    }
  }
);
