
'use server';

import admin from 'firebase-admin';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * It is idempotent and will only initialize the app once.
 *
 * This function now reads credentials directly from a service account JSON file
 * located at `docs/service-account.json`.
 *
 * @returns {Promise<admin.app.App>} A promise that resolves to the initialized Firebase Admin App instance.
 */
export async function initializeServerApp(): Promise<admin.app.App> {
  // Use the SDK's built-in check to prevent re-initialization.
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    // Construct the absolute path to the service account file.
    const serviceAccountPath = path.resolve(process.cwd(), 'docs', 'service-account.json');
    
    // Read the file contents.
    const serviceAccountString = await fs.readFile(serviceAccountPath, 'utf-8');
    
    // Check if the file is empty or just has placeholder content.
    if (!serviceAccountString || serviceAccountString.trim().length < 10) {
        throw new Error('The service account file at "docs/service-account.json" is empty or invalid. Please paste your Firebase service account key into it.');
    }

    const serviceAccount = JSON.parse(serviceAccountString);

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("Firebase Admin SDK initialized successfully from service account file.");
    return app;

  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin SDK from service account file.", error);
    // Provide a more specific error if parsing fails.
    if (error instanceof SyntaxError) {
        throw new Error('Failed to parse "docs/service-account.json". Please ensure it contains valid JSON.');
    }
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}
