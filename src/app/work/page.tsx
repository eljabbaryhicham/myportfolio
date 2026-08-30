import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getPortfolioItemBySlug } from '@/lib/portfolio-items';
import { getLocalizedString } from '@/lib/i18n/multilingual';
import WorkPageClient from './WorkPageClient';

const SITE_URL = 'https://mellivision.com';

// /work?id=<slug> deep links resolve per-item metadata so the open title,
// description and JSON-LD-style og data match the shared project.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id: slug } = await searchParams;

  const base: Metadata = {
    title: 'Work',
    description:
      'Selected work from MelliVision — motion design, VFX, animation and brand films for clients worldwide.',
    alternates: { canonical: '/work' },
    openGraph: {
      title: 'Work — MelliVision',
      description: 'Selected work from MelliVision.',
      url: `${SITE_URL}/work`,
      images: [
        {
          url: '/opengraph-image',
          width: 1200,
          height: 630,
          alt: 'MelliVision — Selected Work',
        },
      ],
    },
  };

  if (!slug) return base;

  const item = await getPortfolioItemBySlug(slug);
  if (!item) return base;

  const title = getLocalizedString(item.title, 'en') || 'Selected Work';
  const description =
    getLocalizedString(item.description, 'en') ||
    'Selected work from MelliVision.';

  return {
    title,
    description,
    alternates: { canonical: `/work?id=${slug}` },
    openGraph: {
      title: `${title} — MelliVision`,
      description,
      url: `${SITE_URL}/work?id=${slug}`,
      images: [
        {
          url: `/api/work-og?id=${encodeURIComponent(slug)}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default function WorkPage() {
  return (
    <Suspense fallback={null}>
      <WorkPageClient />
    </Suspense>
  );
}
