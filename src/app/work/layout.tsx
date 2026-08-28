import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Selected work from MelliVision — motion design, VFX, animation and brand films for clients worldwide. Browse our portfolio.',
  alternates: { canonical: '/work' },
  openGraph: {
    title: 'Work — MelliVision',
    description:
      'Selected work — motion design, VFX, animation and brand films.',
    url: 'https://mellivision.com/work',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'MelliVision — Selected Work' }],
  },
};

export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
