// Server component wrapper for the /work page. Reads searchParams.id,
// resolves the portfolio item, generates per-item JSON-LD (VideoObject +
// BreadcrumbList) for Google rich results, and renders the client page.
//
// generateMetadata lives in app/work/layout.tsx so it applies to both this
// page and any nested routes.
import { initializeServerApp } from '@/firebase/server-init';
import { logger } from '@/lib/logger';
import { portfolioItemJsonLd, type MinimalPortfolioItem } from '@/lib/structured-data';
import WorkPageClient from './WorkPageClient';

async function fetchItem(id: string | undefined): Promise<MinimalPortfolioItem | null> {
  if (!id) return null;
  try {
    const app = await initializeServerApp();
    const snap = await app.firestore().collection('portfolio').doc(id).get();
    if (!snap.exists) return null;
    return snap.data() as MinimalPortfolioItem;
  } catch (e) {
    logger.warn(`work/page: failed to read portfolio/${id}`, e);
    return null;
  }
}

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const id = typeof params.id === 'string' ? params.id : '';
  const item = await fetchItem(id);
  const jsonLd = item ? portfolioItemJsonLd({ ...item, id }) : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          // JSON-LD is parsed by Googlebot from anywhere in the document;
          // rendering here keeps the data co-located with the deep-link route.
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      ) : null}
      <WorkPageClient />
    </>
  );
}