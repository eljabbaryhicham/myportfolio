'use server';

import { initializeServerApp } from '@/firebase/server-init';
import admin from 'firebase-admin';
import type { MultilingualString } from '@/lib/i18n/multilingual';

interface MigrationResult {
  success: boolean;
  message: string;
  details?: {
    projectsUpdated: number;
    clientsUpdated: number;
    homepageUpdated: boolean;
    contactUpdated: boolean;
    errors: string[];
  };
}

function toMultilingual(value: string | MultilingualString | undefined): MultilingualString {
  if (!value) return { en: '', fr: '' };
  if (typeof value === 'string') return { en: value, fr: '' };
  return { en: value.en || '', fr: value.fr || '' };
}

export async function migrateToMultilingual(): Promise<MigrationResult> {
  const errors: string[] = [];
  let projectsUpdated = 0;
  let clientsUpdated = 0;
  let homepageUpdated = false;
  let contactUpdated = false;

  try {
    const app = await initializeServerApp();
    const db = admin.firestore(app);

    // 1. Migrate projects collection
    try {
      const projectsSnap = await db.collection('projects').get();
      const batch = db.batch();
      
      for (const docSnap of projectsSnap.docs) {
        const data = docSnap.data();
        let hasChanges = false;
        const updates: Record<string, MultilingualString> = {};

        if (data.title && typeof data.title === 'string') {
          updates.title = toMultilingual(data.title);
          hasChanges = true;
        }
        if (data.description && typeof data.description === 'string') {
          updates.description = toMultilingual(data.description);
          hasChanges = true;
        }
        if (data.details && typeof data.details === 'string') {
          updates.details = toMultilingual(data.details);
          hasChanges = true;
        }

        if (hasChanges) {
          batch.update(docSnap.ref, updates);
          projectsUpdated++;
        }
      }
      
      if (projectsUpdated > 0) {
        await batch.commit();
      }
    } catch (e: any) {
      errors.push(`Projects migration failed: ${e.message}`);
    }

    // 2. Migrate clients collection
    try {
      const clientsSnap = await db.collection('clients').get();
      const batch = db.batch();
      
      for (const docSnap of clientsSnap.docs) {
        const data = docSnap.data();
        if (data.name && typeof data.name === 'string') {
          batch.update(docSnap.ref, { name: toMultilingual(data.name) });
          clientsUpdated++;
        }
      }
      
      if (clientsUpdated > 0) {
        await batch.commit();
      }
    } catch (e: any) {
      errors.push(`Clients migration failed: ${e.message}`);
    }

    // 3. Migrate homepage/settings document
    try {
      const settingsRef = db.collection('homepage').doc('settings');
      const settingsSnap = await settingsRef.get();
      
      if (settingsSnap.exists) {
        const data = settingsSnap.data() || {};
        const updates: Record<string, MultilingualString> = {};
        let hasChanges = false;

        const textFields = [
          'homePageTitle',
          'homePageSubtitle',
          'workHeading',
          'workSubtitle',
          'contactHeading',
          'contactSubtitle',
          'aboutHeading',
          'aboutSubtitle',
        ];

        for (const field of textFields) {
          if (data[field] && typeof data[field] === 'string') {
            updates[field] = toMultilingual(data[field]);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await settingsRef.update(updates);
          homepageUpdated = true;
        }
      }
    } catch (e: any) {
      errors.push(`Homepage settings migration failed: ${e.message}`);
    }

    // 4. Migrate contact/details document
    try {
      const contactRef = db.collection('contact').doc('details');
      const contactSnap = await contactRef.get();
      
      if (contactSnap.exists) {
        const data = contactSnap.data() || {};
        const updates: Record<string, MultilingualString> = {};
        let hasChanges = false;

        const textFields = ['name', 'title'];

        for (const field of textFields) {
          if (data[field] && typeof data[field] === 'string') {
            updates[field] = toMultilingual(data[field]);
            hasChanges = true;
          }
        }

        if (hasChanges) {
          await contactRef.update(updates);
          contactUpdated = true;
        }
      }
    } catch (e: any) {
      errors.push(`Contact details migration failed: ${e.message}`);
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 
        ? `Migration completed successfully. Projects: ${projectsUpdated}, Clients: ${clientsUpdated}, Homepage: ${homepageUpdated}, Contact: ${contactUpdated}`
        : `Migration completed with ${errors.length} error(s)`,
      details: { projectsUpdated, clientsUpdated, homepageUpdated, contactUpdated, errors },
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Migration failed: ${e.message}`,
      details: { projectsUpdated, clientsUpdated, homepageUpdated, contactUpdated, errors: [e.message] },
    };
  }
}

export async function runMigrationIfNeeded(): Promise<MigrationResult> {
  try {
    const app = await initializeServerApp();
    const db = admin.firestore(app);
    
    // Check if migration already ran by looking for a marker document
    const markerRef = db.collection('_migrations').doc('multilingual_v1');
    const markerSnap = await markerRef.get();
    
    if (markerSnap.exists) {
      return {
        success: true,
        message: 'Migration already completed',
        details: { projectsUpdated: 0, clientsUpdated: 0, homepageUpdated: false, contactUpdated: false, errors: [] },
      };
    }

    const result = await migrateToMultilingual();
    
    if (result.success) {
      // Mark migration as complete
      await markerRef.set({ completedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    
    return result;
  } catch (e: any) {
    return {
      success: false,
      message: `Migration check failed: ${e.message}`,
      details: { projectsUpdated: 0, clientsUpdated: 0, homepageUpdated: false, contactUpdated: false, errors: [e.message] },
    };
  }
}