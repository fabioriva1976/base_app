/**
 * File di configurazione globale per le Cloud Functions.
 * Contiene costanti e configurazioni condivise per evitare dipendenze circolari.
 */

// --- CONFIGURAZIONE GLOBALE ---

export const region = "europe-west1";
export const timezone = "Europe/Rome";

// Configurazione risorse per ridurre l'utilizzo CPU e evitare quota exceeded
export const runtimeOpts = {
    cpu: 1,              // Riduce da 2 CPU a 1 CPU
    memory: "128MiB",    // Riduce la memoria allocata al minimo
    minInstances: 0,     // Nessuna istanza sempre attiva
    maxInstances: 10     // Limita il numero massimo di istanze
} as const;

// Origini CORS consentite. In locale includiamo anche localhost per permettere le chiamate dagli emulatori/UI dev.
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;

if (!projectId) {
    throw new Error("Missing env var: FIREBASE_PROJECT_ID (or GCLOUD_PROJECT/GOOGLE_CLOUD_PROJECT)");
}

const baseCorsOrigins = [
    `https://${projectId}.web.app`,
    `https://${projectId}.firebaseapp.com`
];

const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
const localCorsOrigins = isEmulator ? [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
] : [];

// Per Firebase Functions v2 (onCall), CORS è gestito automaticamente
// Usiamo 'true' negli emulatori per consentire tutte le origini durante lo sviluppo
export const corsOrigins = isEmulator ? true : [...baseCorsOrigins, ...localCorsOrigins];
