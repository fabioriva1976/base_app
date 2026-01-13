import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const requiredEnv = (key: keyof ImportMetaEnv) => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }
  return value;
};

// Project ID centralizzato (override con PUBLIC_FIREBASE_PROJECT_ID se serve)
const projectId = requiredEnv('PUBLIC_FIREBASE_PROJECT_ID');
const apiKey = requiredEnv('PUBLIC_FIREBASE_API_KEY');
const appId = requiredEnv('PUBLIC_FIREBASE_APP_ID');
const messagingSenderId = requiredEnv('PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
const authDomain = import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
const storageBucket = import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId: projectId,
  storageBucket,
  messagingSenderId,
  appId
};

const region = 'europe-west1';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = typeof window !== 'undefined'
  ? initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    })
  : getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, region);

// Connetti agli emulatori se in locale
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9299);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}
