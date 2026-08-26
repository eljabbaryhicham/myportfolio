
'use server';

import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * Idempotent — initializes at most once per process.
 *
 * Credential resolution order:
 *  1. `FIREBASE_SERVICE_ACCOUNT_KEY` env var containing the full service-account JSON.
 *     (newlines in the private_key may be stored escaped as \\n and are unescaped here)
 *  2. A service-account file at `docs/service-account.json` (local development convenience).
 *  3. Application Default Credentials — available automatically on Google Cloud runtimes
 *     such as Firebase App Hosting / Cloud Run.
 *
 * @returns {Promise<admin.app.App>} A promise that resolves to the initialized Firebase Admin App instance.
 */
export async function initializeServerApp(): Promise<admin.app.App> {
  // Use the SDK's built-in check to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // 1. Inline JSON from an environment variable.
  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envKey && envKey.trim()) {
    try {
      const serviceAccount = JSON.parse(envKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_KEY env var.');
      return app;
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var.', error);
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is set but not valid JSON. Please fix the environment variable.');
    }
  }

  // 2. Build a service account from individual env vars.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    try {
      const app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized from FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY env vars.');
      return app;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK from individual env vars.', error);
      throw new Error('FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY are set but invalid. Please fix the environment variables.');
    }
  }

  // 3. Local service-account file (optional, for local development).
  const serviceAccountPath = path.resolve(process.cwd(), 'docs', 'service-account.json');
  try {
    const serviceAccountString = await fs.readFile(serviceAccountPath, 'utf-8');
    if (serviceAccountString && !serviceAccountString.includes('PASTE_YOUR_PRIVATE_KEY_HERE')) {
      const serviceAccount = JSON.parse(serviceAccountString);
      const app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully from service account file.');
      return app;
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to read/parse "docs/service-account.json". Falling back to Application Default Credentials.', error);
    }
  }

  // 4. Application Default Credentials (Firebase App Hosting, Cloud Run, etc.).
  try {
    const app = admin.initializeApp();
    console.log('Firebase Admin SDK initialized with Application Default Credentials.');
    return app;
  } catch (error) {
    console.error('Firebase Admin initialization failed.', error);
    throw new Error(
      'Could not initialize the Firebase Admin SDK. Provide FIREBASE_SERVICE_ACCOUNT_KEY, add "docs/service-account.json" (local dev), or run on a Google Cloud environment with Application Default Credentials.'
    );
  }
}
