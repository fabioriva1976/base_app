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

// Project ID centralizzato (override con PUBLIC_FIREBASE_PROJECT_ID se serve)
const projectId = import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || 'base-app-12108';

const firebaseConfig = {
  apiKey: "AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.firebasestorage.app`,
  messagingSenderId: "261397129842",
  appId: "1:261397129842:web:e465329890a1220ed6b0eb"
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
