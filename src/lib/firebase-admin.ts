import { initializeApp, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

// Il Project ID viene letto dalle variabili d'ambiente, che sono standard in Google Cloud.
// Questo elimina l'hardcoding e rende il codice portabile.
const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'legal-816fa';

if (!getApps().length) {
  // Questa singola chiamata a initializeApp() funziona ovunque:
  // - In produzione (Cloud Functions/Run): usa le credenziali fornite dall'ambiente.
  // - In locale (con `gcloud auth`): usa le credenziali del tuo utente.
  // - In locale (con emulatori): non ha bisogno di credenziali per connettersi.
  // L'SDK gestisce tutto automaticamente.
  app = initializeApp({
    projectId: projectId,
  });
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

// Connetti agli emulatori in sviluppo locale
if (process.env.NODE_ENV !== 'production') {
  // Imposta l'URL dell'emulatore Auth
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099';
}

export const adminAuth = auth;
export const adminDb = db;
export { app };
