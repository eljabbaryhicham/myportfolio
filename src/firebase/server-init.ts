
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
 * - FIREBASE_SERVICE_ACCOUNT: The JSON content of your service account key.
 * - FIREBASE_DATABASE_URL: The URL of your Firebase/Firestore database.
 * 
 * @returns {admin.app.App} The initialized Firebase Admin App instance.
 */
export function initializeServerApp(): admin.app.App {
  if (serverApp) {
    return serverApp;
  }

  const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
  const databaseURLEnv = process.env.FIREBASE_DATABASE_URL;

  if (!serviceAccountEnv) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please provide your service account JSON.'
    );
  }
  if (!databaseURLEnv) {
    throw new Error(
      'FIREBASE_DATABASE_URL environment variable is not set. Please provide your database URL.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);

    serverApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURLEnv,
    });
    
    console.log("Firebase Admin SDK initialized successfully.");
    return serverApp;

  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT or initialize Firebase Admin SDK.", error);
    throw new Error("Firebase Admin SDK initialization failed.");
  }
}
