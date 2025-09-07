
'use server';

import 'dotenv/config';
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
        console.log('✅ Firebase Admin SDK successfully initialized.');
      } catch (error) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error);
      }
    } else {
      adminDb = admin.firestore();
      initialized = true;
    }
  } else {
    console.warn(
      'Firebase Admin SDK not initialized. FIREBASE_SERVICE_ACCOUNT_JSON is not set.'
    );
  }
}

// Initialize on first import
initializeAdminApp();

export { admin, adminDb };
