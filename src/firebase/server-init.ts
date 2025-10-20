
'use server';

import admin from 'firebase-admin';

// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK and should never be exposed to the client.

/**
 * Initializes the Firebase Admin SDK for server-side operations if not already initialized.
 * It is idempotent and will only initialize the app once.
 *
 * It requires environment variables to be set up:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 *
 * @returns {Promise<admin.app.App>} A promise that resolves to the initialized Firebase Admin App instance.
 */
export async function initializeServerApp(): Promise<admin.app.App> {
  // Use the SDK's built-in check to prevent re-initialization
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace the literal '\\n' characters with actual newlines
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Required Firebase Admin environment variables (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY) are not set.');
  }

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log("Firebase Admin SDK initialized successfully.");
    return app;

  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK.", error);
    throw new Error("Firebase Admin SDK initialization failed.");
  }
}
