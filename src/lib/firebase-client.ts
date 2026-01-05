import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyA1SVPwsTYb6n2Jv2A5nAed4DSOWkZRRFY",
  authDomain: "legal-816fa.firebaseapp.com",
  projectId: "legal-816fa",
  storageBucket: "legal-816fa.firebasestorage.app",
  messagingSenderId: "344057379796",
  appId: "1:344057379796:web:0fcec2f4583ad23e633441"
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
