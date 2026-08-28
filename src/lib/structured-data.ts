// Single source of truth for site-wide structured data (JSON-LD).
// Google reads these from <script type="application/ld+json"> tags in the
// <head> to build Knowledge Panel and rich results.
import { getHomePageSettings } from '@/lib/home-page-settings';

const SITE_URL = 'https://mellivision.com';

function organizationLd(settings: Awaited<ReturnType<typeof getHomePageSettings>>) {
  const logoUrl =
    settings?.menubarLogoUrl ||
    settings?.homePageLogoUrl ||
    settings?.faviconUrl ||
    `${SITE_URL}/favicon.ico`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'MelliVision',
    url: SITE_URL,
    logo: logoUrl,
    description:
      'Premium motion design, VFX and creative production for brands worldwide.',
    sameAs: [
      // add real social profile URLs here when available
    ],
  };
}

function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: 'MelliVision',
    inLanguage: ['en', 'fr'],
    publisher: { '@id': `${SITE_URL}/#organization` },
  };
}

function personLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: 'Hicham El Jabbary',
    jobTitle: 'Motion Designer & Creative Director',
    worksFor: { '@id': `${SITE_URL}/#organization` },
    url: SITE_URL,
  };
}

export async function getStructuredDataJsonLd(): Promise<string> {
  const settings = await getHomePageSettings();
  const graph = [organizationLd(settings), websiteLd(), personLd()];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}
