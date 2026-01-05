import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s",
  authDomain: "base-app-12108.firebaseapp.com",
  projectId: "base-app-12108",
  storageBucket: "base-app-12108.firebasestorage.app",
  messagingSenderId: "261397129842",
  appId: "1:261397129842:web:e465329890a1220ed6b0eb"
};

const region = 'europe-west1';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, region);

// Connetti agli emulatori se in locale
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9299);
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}
