
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

// Check if the service account JSON is available in environment variables
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  // Initialize Firebase Admin SDK only if it's not already initialized
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      adminDb = admin.firestore();
    } catch (error) {
      console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Firebase Admin SDK initialization failed. Make sure the environment variable is a valid JSON string.'
        );
      }
    }
  } else {
    adminDb = admin.firestore();
  }
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'Firebase Admin SDK not initialized. GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.'
    );
  }
}

// @ts-ignore
export { admin, adminDb };
