
'use server';

import admin from 'firebase-admin';

// IMPORTANT: This file is for server-side use only.
// It uses the Firebase Admin SDK and should never be exposed to the client.

// A cache to ensure we don't re-initialize the app on every server-side call.
let serverApp: admin.app.App | null = null;

/**
 * Initializes the Firebase Admin SDK for server-side operations.
 * It is idempotent and will only initialize the app once.
 *
 * It requires environment variables to be set up:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY
 * - FIREBASE_DATABASE_URL
 *
 * @returns {admin.app.App} The initialized Firebase Admin App instance.
 */
export function initializeServerApp(): admin.app.App {
  if (serverApp) {
    return serverApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Replace the literal '\n' characters with actual newlines
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    throw new Error('One or more required Firebase Admin environment variables are not set.');
  }

  try {
    serverApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL,
    });

    console.log("Firebase Admin SDK initialized successfully.");
    return serverApp;

  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK.", error);
    throw new Error("Firebase Admin SDK initialization failed.");
  }
}
