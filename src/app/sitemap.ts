import type { MetadataRoute } from 'next';
import { initializeServerApp } from '@/firebase/server-init';
import { logger } from '@/lib/logger';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://mellivision.com';
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/work`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];
  try {
    const app = await initializeServerApp();
    const snap = await app.firestore().collection('portfolio').get();
    const workEntries: MetadataRoute.Sitemap = snap.docs
      .map((doc) => {
        const data = doc.data() as { id?: string; updatedAt?: { toDate?: () => Date } };
        if (!data.id) return null;
        const updated =
          data.updatedAt && typeof data.updatedAt.toDate === 'function'
            ? data.updatedAt.toDate()
            : now;
        return {
          url: `${base}/work?id=${encodeURIComponent(data.id)}`,
          lastModified: updated,
          changeFrequency: 'monthly',
          priority: 0.8,
        } as MetadataRoute.Sitemap[number];
      })
      .filter((x): x is MetadataRoute.Sitemap[number] => x !== null);
    return [...staticEntries, ...workEntries];
  } catch (e) {
    logger.warn('sitemap: failed to read portfolio collection, returning static entries only', e);
    return staticEntries;
  }
}
