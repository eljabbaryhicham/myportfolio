// Per-item OG image: /api/work-og?id=<slug>
// Returns a 1200x630 PNG generated with next/og ImageResponse. Used as the
// og:image for /work?id=... deep links.
import { ImageResponse } from 'next/og';
import { logger } from '@/lib/logger';
import { getPortfolioItemBySlug } from '@/lib/portfolio-items';

export const runtime = 'nodejs';

type MinimalItem = {
  title?: { en?: string; fr?: string } | string;
  description?: { en?: string; fr?: string } | string;
  thumbnailUrl?: string;
};

function pickString(v: { en?: string; fr?: string } | string | undefined, fallback: string): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return v.en || v.fr || fallback;
  return fallback;
}

async function fetchItem(slug: string): Promise<MinimalItem | null> {
  try {
    // Deep links use /work?id=<slug-of-title>. Resolve through the same server
    // fetcher /work uses so the OG card matches the project grid.
    const item = await getPortfolioItemBySlug(slug);
    if (!item) return null;
    return {
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
    };
  } catch (e) {
    logger.warn(`work-og: failed to resolve slug "${slug}"`, e);
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') ?? '';
  const item = await fetchItem(id);
  const title = pickString(item?.title, 'Selected Work');
  const subtitle = item?.description
    ? pickString(item.description, 'Selected work from MelliVision')
    : 'Selected work from MelliVision';
  const thumbnail = item?.thumbnailUrl;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#000',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- ImageResponse renders HTML directly and does not support next/image.
          <img
            src={thumbnail}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.55,
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 60,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: '#fca5a5',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            MelliVision
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              maxWidth: 1000,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 26,
              color: 'rgba(255,255,255,0.8)',
              maxWidth: 900,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
