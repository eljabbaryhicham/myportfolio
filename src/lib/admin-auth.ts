import { NextRequest } from 'next/server';
import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';

import { SUPERADMIN_EMAIL } from '@/lib/constants';

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function verifyAdminRequest(req: NextRequest): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  // 1. Try strict verification via Admin SDK
  try {
    const app = await initializeServerApp();
    const decoded = await admin.auth(app).verifyIdToken(token);
    // decoded contains uid, email, etc.
    // Check superadmin or permissions
    if (decoded.email === SUPERADMIN_EMAIL) return decoded as any;

    // For non-superadmin, check Firestore permissions (canUploadMedia)
    // If Firestore check fails, still allow if token is valid (fallback to default true as client does: ?? true)
    try {
      const db = admin.firestore(app);
      const snap = await db.collection('users').doc(decoded.uid).get();
      if (snap.exists) {
        const data = snap.data() as any;
        const canUpload = data?.permissions?.canUploadMedia ?? true;
        if (canUpload) return decoded as any;
        // If explicitly false, deny
        return null;
      }
      // No user doc => default allow (matches client `?? true`)
      return decoded as any;
    } catch (e) {
      console.warn('verifyAdminRequest: Firestore permission check failed, denying access', e);
      return null;
    }
  } catch (e) {
    console.warn('verifyAdminRequest: strict verification failed', e);
    // 2. Fallback: decode without verification (DEV ONLY — never in production)
    if (process.env.NODE_ENV === 'production') {
      console.error('verifyAdminRequest: Admin SDK verification failed in production — denying access');
      return null;
    }
    const payload = decodeJwtPayload(token);
    if (!payload || !payload.sub) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    if (payload.email === SUPERADMIN_EMAIL) {
      return { uid: payload.sub, email: payload.email };
    }
    return null;
  }
}
