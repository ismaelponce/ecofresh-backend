import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

dotenv.config();

const email = process.env.TEST_USER_EMAIL || 'test@example.com';
const password = process.env.TEST_USER_PASSWORD || 'testpassword123';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

console.log('Firebase Config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : undefined
});
console.log('Test Email:', email);
console.log('Attempting to sign in...');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function getTestToken() {
  try {
    // Sign in with existing credentials
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful');

    // Get the ID token
    const token = await userCredential.user.getIdToken();
    console.log('\nYour test token:', token);
    console.log('Firebase UID:', userCredential.user.uid);
  } catch (error) {
    console.error('\nError details:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
  }
}

getTestToken(); 