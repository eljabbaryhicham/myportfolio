
'use server';

import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

let cachedApp: admin.app.App | null = null;

export async function initializeServerApp(): Promise<admin.app.App> {
  if (cachedApp) return cachedApp;

  if (admin.apps.length > 0) {
    cachedApp = admin.app();
    return cachedApp;
  }

  const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (envKey && envKey.trim()) {
    try {
      const serviceAccount = JSON.parse(envKey);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      cachedApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized from FIREBASE_SERVICE_ACCOUNT_KEY env var.');
      return cachedApp;
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY env var.', error);
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is set but not valid JSON. Please fix the environment variable.');
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    try {
      cachedApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      console.log('Firebase Admin SDK initialized from FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY env vars.');
      return cachedApp;
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK from individual env vars.', error);
      throw new Error('FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY are set but invalid. Please fix the environment variables.');
    }
  }

  const serviceAccountPath = path.resolve(process.cwd(), 'docs', 'service-account.json');
  try {
    const serviceAccountString = await fs.readFile(serviceAccountPath, 'utf-8');
    if (serviceAccountString && !serviceAccountString.includes('PASTE_YOUR_PRIVATE_KEY_HERE')) {
      const serviceAccount = JSON.parse(serviceAccountString);
      cachedApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin SDK initialized successfully from service account file.');
      return cachedApp;
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to read/parse "docs/service-account.json". Falling back to Application Default Credentials.', error);
    }
  }

  try {
    cachedApp = admin.initializeApp();
    console.log('Firebase Admin SDK initialized with Application Default Credentials.');
    return cachedApp;
  } catch (error) {
    console.error('Firebase Admin initialization failed.', error);
    throw new Error(
      'Could not initialize the Firebase Admin SDK. Provide FIREBASE_SERVICE_ACCOUNT_KEY, add "docs/service-account.json" (local dev), or run on a Google Cloud environment with Application Default Credentials.'
    );
  }
}
