import type { Metadata } from 'next';
import AboutPage from "@/features/about/components/AboutPage";

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about MelliVision — a motion design and VFX studio crafting compelling visual content for brands worldwide. Meet the team and our process.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About MelliVision',
    description:
      'Motion design, VFX and creative production studio. Driven by detail.',
    url: 'https://mellivision.com/about',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'About MelliVision' }],
  },
};

export default AboutPage;
