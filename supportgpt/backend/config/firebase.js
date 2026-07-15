/**
 * Firebase Admin SDK Initialization
 * Supports applicationDefault() and service account JSON
 */

import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

let initialized = false;

function initializeFirebase() {
  if (initialized || admin.apps.length > 0) {
    return;
  }

  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'ajraksha-bedcb';

  // Option 1: Use explicit service account JSON file if path provided
  if (serviceAccountPath && existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
      console.log('[Firebase] ✅ Initialized with service account file.');
      initialized = true;
      return;
    } catch (err) {
      console.warn('[Firebase] ⚠️  Failed to read service account file:', err.message);
    }
  }

  // Option 2: Use inline service account from env var (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
      console.log('[Firebase] ✅ Initialized with service account from environment.');
      initialized = true;
      return;
    } catch (err) {
      console.warn('[Firebase] ⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    }
  }

  // Option 3: Application Default Credentials (GCP/Cloud Run/local gcloud auth)
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
    console.log('[Firebase] ✅ Initialized with Application Default Credentials.');
    initialized = true;
    return;
  } catch (err) {
    console.warn('[Firebase] ⚠️  Application Default Credentials not available:', err.message);
  }

  // Fallback: Initialize without credentials (token verification will fail gracefully)
  console.warn(`
[Firebase] ⚠️  WARNING: Firebase initialized without valid credentials!
  Token verification will not work until you provide credentials.
  
  To fix this, set ONE of the following:
  1. GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
  2. FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
  3. Run 'gcloud auth application-default login' for local dev
  
  Project ID: ${projectId}
  `);

  try {
    admin.initializeApp({ projectId });
    initialized = true;
  } catch (err) {
    console.error('[Firebase] ❌ Fatal: Could not initialize Firebase at all:', err.message);
  }
}

// Initialize on module load
initializeFirebase();

export const auth = admin.auth();
export default admin;
