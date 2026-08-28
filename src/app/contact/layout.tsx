import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with MelliVision for motion design, VFX and creative production projects. We respond within 24 hours.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact MelliVision',
    description:
      'Get in touch for motion design, VFX and creative production projects.',
    url: 'https://mellivision.com/contact',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Contact MelliVision' }],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
