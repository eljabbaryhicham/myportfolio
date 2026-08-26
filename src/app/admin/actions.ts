'use server';

import admin from 'firebase-admin';
import { initializeServerApp } from '@/firebase/server-init';
import { SUPERADMIN_EMAIL } from '@/lib/constants';

const DEFAULT_PERMISSIONS = {
  canUploadMedia: true,
  canDeleteMedia: false,
  canEditProjects: true,
  canEditAbout: false,
  canEditContact: false,
  canEditHome: false,
};

export async function syncAuthUsersToFirestore(): Promise<{
  synced: number;
  users: Array<{ email: string; username: string }>;
  error?: string;
}> {
  try {
    const app = await initializeServerApp();
    const auth = admin.auth(app);
    const db = admin.firestore(app);

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
      const isSuperAdmin = email === SUPERADMIN_EMAIL;

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
    return { synced: 0, users: [], error: error.message || 'Unknown error' };
  }
}
