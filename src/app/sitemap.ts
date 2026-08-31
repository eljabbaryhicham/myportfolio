import type { MetadataRoute } from 'next';
import { getPortfolioItems } from '@/lib/portfolio-items';
import { logger } from '@/lib/logger';

// Regenerate the sitemap on each request so it always reflects the latest
// published work instead of being locked to what was available at build time.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://mellivision.com';
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/work`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Reuse the cached getPortfolioItems() (canonical `projects` collection,
  // 5-minute revalidate + tag invalidation) instead of an independent,
  // un-cached read of a different `portfolio` collection. This keeps the
  // sitemap consistent with /work and avoids a redundant Firestore read.
  const items = await getPortfolioItems();
  if (!items) {
    logger.warn('sitemap: no portfolio items available, returning static entries only');
    return staticEntries;
  }

  const workEntries: MetadataRoute.Sitemap = items
    .map((item) => {
      if (!item.id) return null;
      const updated =
        item.updatedAt && typeof item.updatedAt.toDate === 'function'
          ? item.updatedAt.toDate()
          : now;
      return {
        url: `${base}/work?id=${encodeURIComponent(item.id)}`,
        lastModified: updated,
        changeFrequency: 'monthly',
        priority: 0.8,
      } as MetadataRoute.Sitemap[number];
    })
    .filter((x): x is MetadataRoute.Sitemap[number] => x !== null);

  return [...staticEntries, ...workEntries];
}
