const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { region, corsOrigins } = require("../index");
const {
    requireAdmin,
    canManageUser,
    canCreateUserWithRole,
    getUserRole
} = require("../utils/authHelpers");

// Inizializza l'Admin SDK (se non è già stato fatto nel file principale)
// È buona norma assicurarsi che sia inizializzato.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const auth = admin.auth();

/**
 * Ottiene la lista di tutti gli utenti - SOLO ADMIN
 */
const userListApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // ✅ SECURITY: Richiede ruolo admin o superiore
    await requireAdmin(request);

    try {
        const userRecords = await auth.listUsers(100); // Prende fino a 100 utenti
        const users = userRecords.users.map((user) => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            disabled: user.disabled,
        }));

        console.log(`Admin ${request.auth.uid} ha listato ${users.length} utenti`);
        return { users };
    } catch (error) {
        console.error("Errore nel listare gli utenti:", error);
        throw new HttpsError('internal', 'Impossibile recuperare gli utenti.');
    }
});

/**
 * Crea un nuovo utente o sincronizza un utente esistente - SOLO ADMIN
 * Se l'utente esiste già in Auth, restituisce il suo UID per permettere
 * la sincronizzazione con Firestore.
 *
 * SECURITY:
 * - Admin può creare solo operatori
 * - Superuser può creare qualsiasi ruolo
 */
const userCreateApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // ✅ SECURITY: Richiede ruolo admin o superiore
    const callerRole = await requireAdmin(request);

    try {
        const data = request.data;
        const { ruolo: targetRole } = data;

        // ✅ SECURITY: Verifica che l'admin possa creare un utente con questo ruolo
        if (!canCreateUserWithRole(callerRole, targetRole)) {
            throw new HttpsError(
                'permission-denied',
                `Non puoi creare un utente con ruolo '${targetRole}'. ` +
                `Admin può creare solo operatori, superuser può creare qualsiasi ruolo.`
            );
        }

        let userRecord;
        let wasExisting = false;

        try {
            // Prova a creare il nuovo utente
            userRecord = await auth.createUser({
                email: data.email,
                password: data.password,
                displayName: data.displayName,
                disabled: data.disabled,
            });

            console.log(`Utente creato con successo da ${request.auth.uid}: ${userRecord.uid} (ruolo: ${targetRole})`);

        } catch (error) {
            // Se l'utente esiste già (email duplicata)
            if (error.code === 'auth/email-already-exists') {
                console.log("Utente già esistente in Auth, recupero i dati:", data.email);

                // Recupera l'utente esistente tramite email
                userRecord = await auth.getUserByEmail(data.email);
                wasExisting = true;

                // Aggiorna i dati dell'utente esistente con i nuovi valori
                await auth.updateUser(userRecord.uid, {
                    displayName: data.displayName,
                    disabled: data.disabled,
                });

                console.log(`Utente esistente sincronizzato da ${request.auth.uid}: ${userRecord.uid}`);
            } else {
                // Se è un altro tipo di errore, lancialo
                throw error;
            }
        }

        // NOTA: L'audit log viene gestito dal trigger Firestore onUtentiChange
        // quando il frontend salva i dati nella collezione 'utenti'

        return {
            uid: userRecord.uid,
            message: wasExisting
                ? "Utente già esistente in Auth, sincronizzato con successo!"
                : "Utente creato con successo!",
            wasExisting: wasExisting
        };
    } catch (error) {
        console.error("Errore nella creazione/sincronizzazione utente:", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * Aggiorna un utente esistente - SOLO ADMIN
 *
 * SECURITY:
 * - Admin può aggiornare solo operatori
 * - Superuser può aggiornare qualsiasi ruolo
 */
const userUpdateApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // ✅ SECURITY: Richiede ruolo admin o superiore
    const callerRole = await requireAdmin(request);

    const data = request.data;
    const { uid, ruolo: targetRole, ...updateData } = data;

    try {
        // Ottieni il ruolo corrente dell'utente target
        const currentTargetRole = await getUserRole(uid);

        if (!currentTargetRole) {
            throw new HttpsError('not-found', 'Utente non trovato in Firestore.');
        }

        // ✅ SECURITY: Verifica che l'admin possa gestire questo utente
        if (!canManageUser(callerRole, currentTargetRole)) {
            throw new HttpsError(
                'permission-denied',
                `Non puoi modificare un utente con ruolo '${currentTargetRole}'. ` +
                `Admin può gestire solo operatori.`
            );
        }

        // Se si sta cambiando il ruolo, verifica i permessi anche per il nuovo ruolo
        if (targetRole && targetRole !== currentTargetRole) {
            if (!canCreateUserWithRole(callerRole, targetRole)) {
                throw new HttpsError(
                    'permission-denied',
                    `Non puoi assegnare il ruolo '${targetRole}'. ` +
                    `Admin può assegnare solo il ruolo operatore.`
                );
            }
        }

        // Aggiorna l'utente in Firebase Auth
        await auth.updateUser(uid, updateData);

        console.log(`Admin ${request.auth.uid} ha aggiornato l'utente ${uid}`);

        // NOTA: L'audit log viene gestito dal trigger Firestore onUtentiChange
        // quando il frontend salva i dati nella collezione 'utenti'

        return { message: "Utente aggiornato con successo!" };
    } catch (error) {
        console.error("Errore nell'aggiornamento utente:", error);
        throw new HttpsError('internal', error.message);
    }
});

/**
 * Elimina un utente - SOLO ADMIN
 *
 * SECURITY:
 * - Admin può eliminare solo operatori
 * - Superuser può eliminare qualsiasi ruolo
 * - Non si può eliminare sé stessi
 */
const userDeleteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // ✅ SECURITY: Richiede ruolo admin o superiore
    const callerRole = await requireAdmin(request);

    const data = request.data;

    try {
        console.log("Richiesta eliminazione utente:", data);

        if (!data.uid || typeof data.uid !== 'string' || data.uid.trim() === '') {
            throw new HttpsError('invalid-argument', 'The uid must be a non-empty string with at most 128 characters.');
        }

        // ✅ SECURITY: Impedisci auto-eliminazione
        if (data.uid === request.auth.uid) {
            throw new HttpsError(
                'permission-denied',
                'Non puoi eliminare il tuo stesso account.'
            );
        }

        // Ottieni il ruolo dell'utente target
        const targetRole = await getUserRole(data.uid);

        if (!targetRole) {
            throw new HttpsError('not-found', 'Utente non trovato in Firestore.');
        }

        // ✅ SECURITY: Verifica che l'admin possa eliminare questo utente
        if (!canManageUser(callerRole, targetRole)) {
            throw new HttpsError(
                'permission-denied',
                `Non puoi eliminare un utente con ruolo '${targetRole}'. ` +
                `Admin può eliminare solo operatori.`
            );
        }

        let oldData = null;
        let userExistsInAuth = false;

        // Verifica se l'utente esiste in Firebase Auth
        try {
            const userRecord = await auth.getUser(data.uid);
            userExistsInAuth = true;
            oldData = {
                email: userRecord.email,
                displayName: userRecord.displayName,
                disabled: userRecord.disabled,
                createdAt: userRecord.metadata.creationTime
            };
        } catch (authError) {
            console.log("Utente non trovato in Auth:", authError.code);
            if (authError.code === 'auth/user-not-found') {
                // L'utente non esiste in Auth, continua comunque per eliminare da Firestore
                userExistsInAuth = false;
            } else {
                throw authError;
            }
        }

        // Elimina l'utente da Auth solo se esiste
        if (userExistsInAuth) {
            await auth.deleteUser(data.uid);
            console.log(`Admin ${request.auth.uid} ha eliminato l'utente ${data.uid} (ruolo: ${targetRole}) da Firebase Auth`);
        } else {
            console.log("Utente non presente in Auth, solo Firestore verrà aggiornato");
        }

        // NOTA: L'audit log viene gestito dal trigger Firestore onUtentiChange
        // quando il frontend elimina il documento dalla collezione 'utenti'

        return {
            message: "Utente eliminato con successo.",
            wasInAuth: userExistsInAuth
        };
    } catch (error) {
        console.error("Errore nell'eliminazione utente:", error);
        throw new HttpsError('internal', error.message);
    }
});


// Esporta tutte le funzioni che vuoi rendere disponibili al file index.js
module.exports = {
    userListApi,
    userCreateApi,
    userUpdateApi,
    userDeleteApi,
};