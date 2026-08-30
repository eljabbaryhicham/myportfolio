import type { Metadata } from 'next';
import { PortfolioItemsProvider } from '@/components/portfolio/portfolio-items-provider';
import { getPortfolioItems } from '@/lib/portfolio-items';

const SITE_URL = 'https://mellivision.com';

export function generateMetadata(): Metadata {
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

export default async function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-fetch the public projects once for the SSR HTML so the project grid
  // renders on first paint instead of waiting for the client Firestore
  // round-trip. Live admin edits still flow through the provider's client
  // subscription after hydration.
  const initialItems = await getPortfolioItems();
  return (
    <PortfolioItemsProvider initialItems={initialItems}>
      {children}
    </PortfolioItemsProvider>
  );
}
