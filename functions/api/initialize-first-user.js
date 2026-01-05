const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { region, corsOrigins } = require("../index");

if (admin.apps.length === 0) {
    admin.initializeApp();
}

// Inizializza il primo utente del sistema:
// - Bypassa i permessi quando la collezione 'utenti' è vuota
// - Imposta il ruolo superuser su Auth (custom claims) e su Firestore
const initializeFirstUserApi = onCall({
    region,
    cors: corsOrigins
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per inizializzare il primo utente.');
    }

    const db = admin.firestore();

    // Se esiste già almeno un utente, blocca l'inizializzazione
    const existingUsers = await db.collection('utenti').limit(1).get();
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

    await db.collection('utenti').doc(uid).set(profileData, { merge: true });

    return { success: true, ruolo: 'superuser' };
});

module.exports = { initializeFirstUserApi };
