import { initializeApp, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_STORAGE_BUCKET
} = process.env;

// Check if all required Firebase configuration variables are present
if (!FIREBASE_PROJECT_ID || !FIREBASE_PRIVATE_KEY || !FIREBASE_CLIENT_EMAIL) {
  throw new Error('Missing Firebase configuration variables');
}

// Firebase Storage bucket name can be in different formats depending on when the project was created
// Try the bucket name from the env variable first, then the new format, then the traditional format
const storageBucket = FIREBASE_STORAGE_BUCKET || 
                     `${FIREBASE_PROJECT_ID}.firebasestorage.app`;

console.log('Initializing Firebase with storage bucket:', storageBucket);

let app: App;
try {
  app = initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket
  });
  console.log('Firebase Admin SDK initialized successfully with storage bucket:', storageBucket);
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  throw error;
}

export const auth = getAuth(app);
export const storage = getStorage(app); 