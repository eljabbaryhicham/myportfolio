import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import admin from 'firebase-admin';
import { initializeServerApp } from '@/firebase/server-init';
import { logger } from '@/lib/logger';

// Rate-limited, token-gated revalidation of the public home page. The admin
// calls this after saving a hero logo so the statically-prerendered `/` is
// regenerated with the new URL server-side (no stale logo in the SSR HTML).
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req))) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  const { idToken } = (body ?? {}) as { idToken?: string };
  if (!idToken) {
    return NextResponse.json({ error: 'Missing ID token.' }, { status: 400 });
  }

  let app: admin.app.App;
  try {
    app = await initializeServerApp();
  } catch (e) {
    logger.error('revalidate-home: Firebase Admin SDK not initialized.', e);
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 503 });
  }

  try {
    await admin.auth(app).verifyIdToken(idToken);
  } catch (e) {
    logger.warn('revalidate-home: token verification failed, denying.', e);
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    revalidatePath('/');
  } catch (e) {
    logger.error('revalidate-home: revalidatePath failed.', e);
    return NextResponse.json({ error: 'Revalidation failed.' }, { status: 500 });
  }

  return NextResponse.json({ revalidated: true });
}