import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { region, corsOrigins } from "../config.js";
import { COLLECTIONS } from "../../shared/constants/collections.js";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Inizializza il primo utente del sistema:
// - Bypassa i permessi quando la collezione 'users' è vuota
// - Imposta il ruolo superuser su Auth (custom claims) e su Firestore
export const initializeFirstUserApi = onCall({
    region,
    cors: corsOrigins
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per inizializzare il primo utente.');
    }

    const db = admin.firestore();

    // Se esiste già almeno un utente, blocca l'inizializzazione
    const existingUsers = await db.collection(COLLECTIONS.USERS).limit(1).get();
    if (!existingUsers.empty) {
        throw new HttpsError('failed-precondition', 'Esistono già utenti registrati.');
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email || null;
    const now = new Date().toISOString();

    // Imposta custom claims su Auth
    await admin.auth().setCustomUserClaims(uid, { role: 'superuser' });

    // Allinea Firestore con ruolo superuser e dati profilo base
    const profileData = {
        email,
        nome: request.data?.nome || null,
        cognome: request.data?.cognome || null,
        telefono: request.data?.telefono || null,
        ruolo: ['superuser'],
        status: true,
        created: now,
        changed: now,
        lastModifiedBy: uid,
        lastModifiedByEmail: email
    };

    await db.collection(COLLECTIONS.USERS).doc(uid).set(profileData, { merge: true });

    return { success: true, ruolo: 'superuser' };
});
