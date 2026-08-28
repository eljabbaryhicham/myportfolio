import type { Metadata } from 'next';

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
  return <>{children}</>;
}
