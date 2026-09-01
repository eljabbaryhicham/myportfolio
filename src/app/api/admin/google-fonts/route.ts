import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { logger } from '@/lib/logger';

export const revalidate = 3600;

interface GoogleFontApiItem {
  family?: string;
}

/**
 * Returns Google Fonts family names to the Home settings UI. The Google API
 * key stays on the server; only the safe, public family names leave this route.
 */
export async function GET(req: NextRequest) {
  const decoded = await verifyAdminRequest(req, 'canEditHome');
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_FONTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Fonts is not configured on the server.' },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${encodeURIComponent(apiKey)}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) {
      logger.warn('google-fonts: Google Fonts API returned an error.', { status: response.status });
      return NextResponse.json({ error: 'Google Fonts could not be loaded.' }, { status: 502 });
    }

    const payload = await response.json() as { items?: GoogleFontApiItem[] };
    const families = (payload.items ?? [])
      .map((item) => item.family?.trim())
      .filter((family): family is string => Boolean(family))
      .sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ families }, {
      headers: { 'Cache-Control': 'private, max-age=3600' },
    });
  } catch (error) {
    logger.error('google-fonts: request failed.', error);
    return NextResponse.json({ error: 'Google Fonts could not be loaded.' }, { status: 502 });
  }
}
