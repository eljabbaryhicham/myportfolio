'use server';

import admin from 'firebase-admin';
import { initializeServerApp } from '@/firebase/server-init';
import { SUPERADMIN_EMAIL, isSuperAdmin as isSuperAdminCheck } from '@/lib/constants';

function friendlyError(error: any): string {
  const msg = error?.message || 'Unknown error';
  if (msg.includes('ENOTFOUND') || msg.includes('metadata.google.internal')) {
    return 'Firebase Admin SDK is not authenticated. Add your service account JSON to docs/service-account.json, or set the FIREBASE_SERVICE_ACCOUNT_KEY env var (see docs/backend.json). This works automatically on Vercel.';
  }
  return msg;
}

const DEFAULT_PERMISSIONS = {
  canUploadMedia: true,
  canDeleteMedia: false,
  canEditProjects: true,
  canEditAbout: false,
  canEditContact: false,
  canEditHome: false,
};

// Server-side gate: only the superadmin may run admin-management actions.
// Accepts the caller's Firebase ID token and verifies it cryptographically.
async function requireSuperAdmin(idToken: string): Promise<admin.app.App | null> {
  if (!idToken) return null;
  try {
    const app = await initializeServerApp();
    const decoded = await admin.auth(app).verifyIdToken(idToken);
    if (isSuperAdminCheck({ email: decoded.email })) return app;
    return null;
  } catch (e) {
    console.warn('requireSuperAdmin: verification failed, denying.', e);
    return null;
  }
}

export async function syncAuthUsersToFirestore(idToken: string): Promise<{
  synced: number;
  users: Array<{ email: string; username: string }>;
  error?: string;
}> {
  try {
    const app = await requireSuperAdmin(idToken);
    if (!app) return { synced: 0, users: [], error: 'Unauthorized. Only the superadmin can sync users.' };
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // DEBUG
    const allAuthUsers = await auth.listUsers(1000);
    const allFirestoreUsers = await db.collection('users').get();
    console.log('[DEBUG] Auth UIDs:', allAuthUsers.users.map(u => u.uid));
    console.log('[DEBUG] Firestore doc IDs:', allFirestoreUsers.docs.map(d => d.id));

    // Fetch all Firebase Auth users (handles pagination automatically)
    const authUsers: Array<{ uid: string; email: string }> = [];
    let pageToken: string | null = null;
    do {
      const result = await auth.listUsers(1000, pageToken ?? undefined);
      result.users.forEach((userRecord) => {
        if (userRecord.email) {
          authUsers.push({ uid: userRecord.uid, email: userRecord.email });
        }
      });
      pageToken = result.pageToken ?? null;
    } while (pageToken);

    // Fetch existing Firestore user doc IDs
    const snapshot = await db.collection('users').select().get();
    const existingUids = new Set(snapshot.docs.map((doc) => doc.id));

    // Find Auth users missing from Firestore
    const missing = authUsers.filter((u) => !existingUids.has(u.uid));

    if (missing.length === 0) {
      return { synced: 0, users: [] };
    }

    // Write missing users to Firestore
    const batch = db.batch();
    const syncedUsers: Array<{ email: string; username: string }> = [];

    for (const authUser of missing) {
      const { email } = authUser;
      const username = email.split('@')[0] || authUser.uid;
      const isSuperAdmin = isSuperAdminCheck({ email });

      const userDoc = {
        uid: authUser.uid,
        username,
        email,
        role: isSuperAdmin ? 'superadmin' : 'admin',
        createdAt: new Date().toISOString(),
        permissions: DEFAULT_PERMISSIONS,
      };

      batch.set(db.collection('users').doc(authUser.uid), userDoc);
      syncedUsers.push({ email, username });
    }

    await batch.commit();

    return { synced: missing.length, users: syncedUsers };
  } catch (error: any) {
    console.error('Sync Auth users failed:', error);
    return { synced: 0, users: [], error: friendlyError(error) };
  }
}

export async function deleteAdminUser(uid: string, idToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    const app = await requireSuperAdmin(idToken);
    if (!app) return { success: false, error: 'Unauthorized. Only the superadmin can delete users.' };
    const auth = admin.auth(app);
    const db = admin.firestore(app);

    // Delete from Firebase Auth
    await auth.deleteUser(uid);

    // Delete from Firestore
    await db.collection('users').doc(uid).delete();

    return { success: true };
  } catch (error: any) {
    console.error('Delete admin user failed:', error);
    return { success: false, error: friendlyError(error) };
  }
}
