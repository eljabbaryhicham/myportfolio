import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import admin from 'firebase-admin';
import { initializeServerApp } from '@/firebase/server-init';
import { isSuperAdmin } from '@/lib/constants';
import { logger } from '@/lib/logger';

// Per-IP rate limit (single-instance, in-memory). A leaked superadmin
// token is the only attack vector here; this blunts bulk grants.
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

// The four content-editing permissions granted to an existing admin account
// whose user doc predates the explicit permissions model (role 'admin' with no
// `permissions` map → every content write is denied by Firestore rules).
const CONTENT_PERMISSIONS = {
  canEditHome: true,
  canEditProjects: true,
  canEditAbout: true,
  canEditContact: true,
} as const;

const bodySchema = z.object({
  idToken: z.string().min(1, 'Missing ID token.'),
  email: z.string().email('email must be a valid email.'),
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

  const { idToken, email } = parsed.data;

  let app: admin.app.App;
  try {
    app = await initializeServerApp();
  } catch (e) {
    logger.error('grant-content-permissions: Firebase Admin SDK not initialized.', e);
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 503 });
  }

  // Superadmin gate: verify the caller's ID token cryptographically and
  // require the superadmin email (case-insensitive, mirrors isSuperAdmin).
  let decoded: admin.auth.DecodedIdToken;
  try {
    decoded = await admin.auth(app).verifyIdToken(idToken);
  } catch (e) {
    logger.warn('grant-content-permissions: token verification failed, denying.', e);
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSuperAdmin({ email: decoded.email ?? null })) {
    return NextResponse.json({ error: 'Only the superadmin can grant permissions.' }, { status: 403 });
  }

  // Find the target user by email.
  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth(app).getUserByEmail(email);
  } catch (e: any) {
    if (e?.code === 'auth/user-not-found') {
      return NextResponse.json({ error: `No user found with email ${email}.` }, { status: 404 });
    }
    logger.error('grant-content-permissions: getUserByEmail failed.', e);
    return NextResponse.json({ error: 'Could not look up user.' }, { status: 500 });
  }

  // Only elevate existing admin-class accounts. Self-registered (role 'user')
  // accounts already get content permissions at signup via register-claim;
  // granting here would bypass that path.
  const db = admin.firestore(app);
  const userDocSnap = await db.collection('users').doc(userRecord.uid).get().catch((e) => {
    logger.error('grant-content-permissions: users doc read failed.', e);
    return null;
  });
  if (!userDocSnap) {
    return NextResponse.json({ error: 'Could not read the target user document.' }, { status: 500 });
  }
  if (!userDocSnap.exists) {
    return NextResponse.json({ error: 'The target user has no Firestore user document.' }, { status: 404 });
  }
  const role = userDocSnap.get('role');
  if (role !== 'admin' && role !== 'superadmin') {
    return NextResponse.json({ error: 'Only admin/superadmin accounts can be granted content permissions.' }, { status: 409 });
  }

  try {
    await db.collection('users').doc(userRecord.uid).set({ permissions: CONTENT_PERMISSIONS }, { merge: true });
  } catch (e) {
    logger.error('grant-content-permissions: grant write failed.', e);
    return NextResponse.json({ error: 'Could not write the permissions.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, uid: userRecord.uid, email, permissions: CONTENT_PERMISSIONS });
}