import { type NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeServerApp } from '@/firebase/server-init';
import { isSuperAdmin } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { isRateLimited, clientIp } from '@/lib/rate-limit';

// Rate-limited, permission-gated revalidation of the public home page. The
// admin calls this after saving a hero logo so the statically-prerendered `/` is
// regenerated with the new URL server-side (no stale logo in the SSR HTML).

export async function POST(req: NextRequest) {
  if (isRateLimited(clientIp(req), 30)) {
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

  let app: App;
  try {
    app = await initializeServerApp();
  } catch (e) {
    logger.error('revalidate-home: Firebase Admin SDK not initialized.', e);
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 503 });
  }

  let decoded;
  try {
    decoded = await getAuth(app).verifyIdToken(idToken);
  } catch (e) {
    logger.warn('revalidate-home: token verification failed, denying.', e);
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Require superadmin or a user doc with canEditHome permission.
  if (isSuperAdmin({ email: decoded.email })) {
    // Superadmin — allowed.
  } else {
    try {
      const db = getFirestore(app);
      const snap = await db.collection('users').doc(decoded.uid).get();
      const data = snap.data() as any;
      if (!snap.exists || data?.permissions?.canEditHome !== true) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    } catch (e) {
      logger.warn('revalidate-home: Firestore permission check failed, denying', e);
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
  }

  try {
    revalidatePath('/');
    revalidatePath('/work');
    // The public SSR seeds are cached independently from route output. Mark
    // them stale so the next visitor gets fresh data without reintroducing a
    // blocking Firestore read for every request.
    revalidateTag('homepage-settings', 'max');
    revalidateTag('trusted-by-clients', 'max');
    revalidateTag('portfolio-items', 'max');
    revalidateTag('contact-details', 'max');
    revalidateTag('about-content', 'max');
  } catch (e) {
    logger.error('revalidate-home: revalidatePath failed.', e);
    return NextResponse.json({ error: 'Revalidation failed.' }, { status: 500 });
  }

  return NextResponse.json({ revalidated: true });
}
