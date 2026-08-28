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

// ---------------------------------------------------------------------------
// Per-item JSON-LD for /work?id=...
// ---------------------------------------------------------------------------
export type MinimalPortfolioItem = {
  id?: string;
  type?: 'image' | 'video';
  title?: { en?: string; fr?: string } | string;
  description?: { en?: string; fr?: string } | string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  previewUrl?: string;
  details?: { en?: string; fr?: string } | string;
  updatedAt?: { toDate?: () => Date };
};

function getLocalized(item: MinimalPortfolioItem, field: 'title' | 'description' | 'details', fallback: string): string {
  const v = item[field];
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return v.en || v.fr || fallback;
  return fallback;
}

export function portfolioItemJsonLd(item: MinimalPortfolioItem): string {
  const title = getLocalized(item, 'title', 'Untitled');
  const description = getLocalized(item, 'description', '');
  const detailText = getLocalized(item, 'details', description);
  const url = `${SITE_URL}/work?id=${encodeURIComponent(item.id || '')}`;
  const thumb = item.thumbnailUrl;
  const isVideo = item.type === 'video' && (item.sourceUrl || item.previewUrl);

  const videoObject = isVideo
    ? {
        '@type': 'VideoObject',
        name: title,
        description: description || detailText,
        thumbnailUrl: thumb ? [thumb] : undefined,
        contentUrl: item.sourceUrl || item.previewUrl,
        embedUrl: url,
        uploadDate: item.updatedAt?.toDate ? item.updatedAt.toDate().toISOString() : undefined,
        publisher: { '@id': `${SITE_URL}/#organization` },
      }
    : null;

  const creativeWork = {
    '@context': 'https://schema.org',
    '@type': isVideo ? 'VideoObject' : 'CreativeWork',
    name: title,
    description: description || detailText,
    url,
    image: thumb,
    author: { '@id': `${SITE_URL}/#person` },
    publisher: { '@id': `${SITE_URL}/#organization` },
    dateModified: item.updatedAt?.toDate ? item.updatedAt.toDate().toISOString() : undefined,
    ...(videoObject ? videoObject : {}),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Work', item: `${SITE_URL}/work` },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  };

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [creativeWork, breadcrumb],
  });
}
