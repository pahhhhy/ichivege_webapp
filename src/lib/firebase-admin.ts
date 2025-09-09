
'use server';

import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | undefined;
let initialized = false;

// Function to initialize Firebase Admin SDK
function initializeAdminApp() {
  if (initialized) return;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (serviceAccountJson) {
    if (admin.apps.length === 0) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        adminDb = admin.firestore();
        initialized = true;
      } catch (error) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON. Ensure it is a valid JSON string.', error);
      }
    } else {
      adminDb = admin.firestore();
      initialized = true;
    }
  } else {
    // This warning is helpful for developers to know the admin SDK is not configured.
    console.warn(
      'Firebase Admin SDK not initialized. The `FIREBASE_SERVICE_ACCOUNT_JSON` environment variable is not set. Server-side features requiring admin privileges will not work.'
    );
  }
}

// Initialize on first import
initializeAdminApp();

export { admin, adminDb };
