import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken, type UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server-init';
import { SUPERADMIN_EMAIL } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Per-IP rate limit (single-instance, in-memory). A leaked superadmin
// token is the only attack vector here; this blunts bulk renames.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
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

const bodySchema = z.object({
  idToken: z.string().min(1, 'Missing ID token.'),
  currentEmail: z.string().email('currentEmail must be a valid email.'),
  newEmail: z.string().email('newEmail must be a valid email.'),
});

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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { idToken, currentEmail, newEmail } = parsed.data;

  if (currentEmail.toLowerCase() === newEmail.toLowerCase()) {
    return NextResponse.json({ error: 'currentEmail and newEmail are the same.' }, { status: 400 });
  }

  // Superadmin gate: verify the caller's ID token cryptographically and
  // require the SUPERADMIN_EMAIL. Mirrors requireSuperAdmin in
  // src/app/admin/actions.ts.
  let app: App;
  try {
    app = await initializeServerApp();
  } catch (e) {
    logger.error('rename-user-email: Firebase Admin SDK not initialized.', e);
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 503 });
  }

  let decoded: DecodedIdToken;
  try {
    decoded = await getAuth(app).verifyIdToken(idToken);
  } catch (e) {
    logger.warn('rename-user-email: token verification failed, denying.', e);
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (decoded.email !== SUPERADMIN_EMAIL) {
    return NextResponse.json({ error: 'Only the superadmin can rename users.' }, { status: 403 });
  }

  // Find the target user by current email.
  let userRecord: UserRecord;
  try {
    userRecord = await getAuth(app).getUserByEmail(currentEmail);
  } catch (e: any) {
    if (e?.code === 'auth/user-not-found') {
      return NextResponse.json({ error: `No user found with email ${currentEmail}.` }, { status: 404 });
    }
    logger.error('rename-user-email: getUserByEmail failed.', e);
    return NextResponse.json({ error: 'Could not look up user.' }, { status: 500 });
  }

  // Rename in Firebase Auth.
  try {
    await getAuth(app).updateUser(userRecord.uid, { email: newEmail });
  } catch (e: any) {
    if (e?.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: `Email ${newEmail} is already in use.` }, { status: 409 });
    }
    if (e?.code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'newEmail is not a valid email address.' }, { status: 400 });
    }
    logger.error('rename-user-email: updateUser failed.', e);
    return NextResponse.json({ error: 'Could not rename user.' }, { status: 500 });
  }

  // Also update the Firestore users/{uid}.email field so the two stay in sync.
  // (The /register-claim and NewAdminForm both write email at create time; if
  // we leave the doc stale, future admin pages will show the old address.)
  try {
    const db = getFirestore(app);
    await db.collection('users').doc(userRecord.uid).update({ email: newEmail });
  } catch (e) {
    // Non-fatal: Auth rename already succeeded. Log and continue.
    logger.warn('rename-user-email: Firestore users/{uid}.email update failed; auth email was renamed but doc is stale.', e);
  }

  return NextResponse.json({ ok: true, uid: userRecord.uid, newEmail });
}
