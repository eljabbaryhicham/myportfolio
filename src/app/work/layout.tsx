import type { Metadata } from 'next';
import { initializeServerApp } from '@/firebase/server-init';
import { logger } from '@/lib/logger';
import type { MinimalPortfolioItem } from '@/lib/structured-data';

const SITE_URL = 'https://mellivision.com';

function pickString(v: { en?: string; fr?: string } | string | undefined, fallback: string): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return v.en || v.fr || fallback;
  return fallback;
}

async function fetchItemById(id: string | undefined): Promise<MinimalPortfolioItem | null> {
  if (!id) return null;
  try {
    const app = await initializeServerApp();
    const snap = await app.firestore().collection('portfolio').doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as MinimalPortfolioItem;
  } catch (e) {
    logger.warn(`work/layout generateMetadata: failed to fetch portfolio/${id}`, e);
    return null;
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }> | { id?: string } | undefined;
}): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const id = typeof params.id === 'string' ? params.id : undefined;
  const item = await fetchItemById(id);

  if (!item) {
    return {
      title: 'Work',
      description:
        'Selected work from MelliVision — motion design, VFX, animation and brand films for clients worldwide.',
      alternates: { canonical: '/work' },
      openGraph: {
        title: 'Work — MelliVision',
        description: 'Selected work from MelliVision.',
        url: `${SITE_URL}/work`,
        images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'MelliVision — Selected Work' }],
      },
    };
  }

  const title = pickString(item.title, 'Selected Work');
  const description = pickString(item.description, '');
  const url = `${SITE_URL}/work?id=${encodeURIComponent(item.id || id || '')}`;
  const itemId = encodeURIComponent(item.id || id || '');
  // /api/work-og returns a 1200x630 branded image using the item's thumbnail.
  const ogImage = `/api/work-og?id=${itemId}`;
  const isVideo = item.type === 'video';

  return {
    title,
    description: description || `${title} — MelliVision selected work.`,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — MelliVision`,
      description: description || 'Selected work from MelliVision.',
      url,
      type: isVideo ? 'video.other' : 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      videos: isVideo && (item.sourceUrl || item.previewUrl)
        ? [{ url: item.sourceUrl || item.previewUrl || '' }]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || `${title} — MelliVision selected work.`,
      images: [{ url: ogImage, alt: title }],
    },
  };
}

export default async function WorkLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams?: Promise<{ id?: string }> | { id?: string };
}) {
  // Layouts in Next.js App Router do NOT receive searchParams in the layout
  // function. They only reach generateMetadata. So we render the per-item
  // JSON-LD inside a tiny server child that reads searchParams via its own
  // props — but layouts CAN read headers/cookies but not searchParams.
  // Practical solution: pre-fetch the same item here is awkward; instead we
  // accept that the JSON-LD for the currently-selected work item comes from
  // the page (work/page.tsx). Layout only owns <head>-only metadata.
  return <>{children}</>;
}