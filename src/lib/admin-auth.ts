import { NextRequest } from 'next/server';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';

import { logger } from '@/lib/logger';
import { SUPERADMIN_EMAIL, isSuperAdmin as isSuperAdminCheck } from '@/lib/constants';

export async function verifyAdminRequest(req: NextRequest): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  // Only path: strict verification via the Admin SDK. A token that cannot be
  // cryptographically verified is NEVER honored — no unverified-decode fallback.
  let app: admin.app.App;
  try {
    app = await initializeServerApp();
  } catch (e) {
    logger.error('verifyAdminRequest: Firebase Admin SDK not initialized, denying access.', e);
    return null;
  }

  let decoded;
  try {
    decoded = await admin.auth(app).verifyIdToken(token);
  } catch (e) {
    logger.warn('verifyAdminRequest: token verification failed, denying access.', e);
    return null;
  }

  if (isSuperAdminCheck({ email: decoded.email })) return decoded as any;

  // Non-superadmin: require an existing user doc that explicitly grants
  // canUploadMedia. No doc or missing permission => deny (fail closed).
  try {
    const db = admin.firestore(app);
    const snap = await db.collection('users').doc(decoded.uid).get();
    if (snap.exists) {
      const data = snap.data() as any;
      if (data?.permissions?.canUploadMedia === true) return decoded as any;
    }
    return null;
  } catch (e) {
    logger.warn('verifyAdminRequest: Firestore permission check failed, denying access', e);
    return null;
  }
}
