import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import { logger } from '@/lib/logger';

// Invitation codes are server-side only. Never accept a code from the client
// without checking it against this env var. If unset, the endpoint refuses
// every request (fail closed).
//
// Set REGISTER_INVITE_CODE in your environment (Vercel / Firebase App Hosting
// managed secrets, or .env.local for dev) to a long random string. Rotate it
// whenever you want to revoke all outstanding self-registration ability.
const INVITE_CODE = process.env.REGISTER_INVITE_CODE;

const formSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username is too long.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscore.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(128),
  code: z.string().min(1, 'Invitation code is required.'),
});

const EMAIL_DOMAIN = 'mellivision.com';

// Small in-memory rate limit per client IP (same pattern as /api/send-email).
// Single-instance; a fresh serverless instance has its own counter, so this
// only blunts abuse from a single IP to a single instance.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
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

  if (!INVITE_CODE) {
    // Fail closed: if the server isn't configured to allow self-registration,
    // refuse all attempts. The superadmin-only NewAdminForm dialog still works.
    logger.error('register-claim: REGISTER_INVITE_CODE env var is not set; denying all requests.');
    return NextResponse.json({ error: 'Self-registration is not configured.' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = formSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const { username, password, code } = parsed.data;

  // Constant-time comparison to avoid trivial timing leaks of the invite code.
  if (code.length !== INVITE_CODE.length || !timingSafeEqual(code, INVITE_CODE)) {
    return NextResponse.json({ error: 'Invalid invitation code.' }, { status: 401 });
  }

  const email = `${username.toLowerCase()}@${EMAIL_DOMAIN}`;

  let app: admin.app.App;
  try {
    app = await initializeServerApp();
  } catch (e) {
    logger.error('register-claim: Firebase Admin SDK not initialized.', e);
    return NextResponse.json({ error: 'Server is not configured for registration.' }, { status: 503 });
  }

  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth(app).createUser({
      email,
      password,
      displayName: username,
    });
  } catch (e: any) {
    if (e?.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });
    }
    if (e?.code === 'auth/invalid-password') {
      return NextResponse.json({ error: 'Password is too weak.' }, { status: 400 });
    }
    logger.error('register-claim: createUser failed.', e);
    return NextResponse.json({ error: 'Could not create account.' }, { status: 500 });
  }

  // Create the user doc with role: 'user' and content-editing permissions
  // only. Per firestore.rules, role stays 'user' (so media reads via isAdmin()
  // stay denied) and there are NO canUploadMedia/canDeleteMedia perms (so
  // media writes stay denied). The superadmin remains the gatekeeper for any
  // elevated role/permission changes.
  try {
    const db = admin.firestore(app);
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      username,
      email: userRecord.email ?? email,
      role: 'user',
      permissions: {
        canEditHome: true,
        canEditProjects: true,
        canEditAbout: true,
        canEditContact: true,
      },
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    // If the user doc fails to write, the Auth user is still created. Roll
    // back to avoid orphaned Auth accounts (otherwise the user could try to
    // sign in later and the next sign-in flow would have no role to gate on).
    logger.error('register-claim: Firestore user doc write failed; rolling back Auth user.', e);
    try {
      await admin.auth(app).deleteUser(userRecord.uid);
    } catch (delErr) {
      logger.error('register-claim: rollback deleteUser failed.', delErr);
    }
    return NextResponse.json({ error: 'Could not finish account setup.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
