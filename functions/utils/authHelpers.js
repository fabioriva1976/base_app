const { HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

/**
 * Ottiene il ruolo dell'utente da Firestore
 * @param {string} uid - UID dell'utente
 * @returns {Promise<string|null>} Il ruolo dell'utente o null se non trovato
 */
async function getUserRole(uid) {
    try {
        const db = admin.firestore();
        const userDoc = await db.collection('utenti').doc(uid).get();

        if (!userDoc.exists) {
            console.warn(`Utente ${uid} non trovato in collezione utenti`);
            return null;
        }

        const ruolo = userDoc.data().ruolo;
        console.log(`Ruolo utente ${uid}: ${ruolo}`);
        return ruolo;
    } catch (error) {
        console.error(`Errore nel recupero ruolo per ${uid}:`, error);
        return null;
    }
}

/**
 * Verifica se un ruolo è superuser
 * @param {string} ruolo - Ruolo da verificare
 * @returns {boolean}
 */
function isSuperUser(ruolo) {
    return ruolo === 'superuser';
}

/**
 * Verifica se un ruolo è admin o superiore
 * @param {string} ruolo - Ruolo da verificare
 * @returns {boolean}
 */
function isAdmin(ruolo) {
    return ruolo === 'admin' || ruolo === 'superuser';
}

/**
 * Verifica se un ruolo è operatore o superiore
 * @param {string} ruolo - Ruolo da verificare
 * @returns {boolean}
 */
function isOperator(ruolo) {
    return ruolo === 'operatore' || ruolo === 'admin' || ruolo === 'superuser';
}

/**
 * Middleware per richiedere autenticazione
 * @param {Object} request - Request object della Cloud Function
 * @throws {HttpsError} Se l'utente non è autenticato
 */
function requireAuth(request) {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }
}

/**
 * Middleware per richiedere ruolo superuser
 * @param {Object} request - Request object della Cloud Function
 * @throws {HttpsError} Se l'utente non è autenticato o non è superuser
 */
async function requireSuperUser(request) {
    requireAuth(request);

    const role = await getUserRole(request.auth.uid);

    if (!isSuperUser(role)) {
        throw new HttpsError(
            'permission-denied',
            'Solo i superuser possono eseguire questa operazione.'
        );
    }

    return role;
}

/**
 * Middleware per richiedere ruolo admin o superiore
 * @param {Object} request - Request object della Cloud Function
 * @throws {HttpsError} Se l'utente non è autenticato o non è admin
 */
async function requireAdmin(request) {
    requireAuth(request);

    const role = await getUserRole(request.auth.uid);

    if (!isAdmin(role)) {
        throw new HttpsError(
            'permission-denied',
            'Solo gli amministratori possono eseguire questa operazione.'
        );
    }

    return role;
}

/**
 * Middleware per richiedere ruolo operatore o superiore
 * @param {Object} request - Request object della Cloud Function
 * @throws {HttpsError} Se l'utente non è autenticato o non è operatore
 */
async function requireOperator(request) {
    requireAuth(request);

    const role = await getUserRole(request.auth.uid);

    if (!isOperator(role)) {
        throw new HttpsError(
            'permission-denied',
            'Non hai i permessi necessari per eseguire questa operazione.'
        );
    }

    return role;
}

/**
 * Verifica se l'utente può gestire un altro utente
 * Un admin può gestire solo operatori
 * Un superuser può gestire chiunque
 * @param {string} callerRole - Ruolo dell'utente chiamante
 * @param {string} targetRole - Ruolo dell'utente target
 * @returns {boolean}
 */
function canManageUser(callerRole, targetRole) {
    // Superuser può gestire chiunque
    if (isSuperUser(callerRole)) {
        return true;
    }

    // Admin può gestire solo operatori
    if (isAdmin(callerRole)) {
        return targetRole === 'operatore';
    }

    return false;
}

/**
 * Verifica se l'utente può creare un utente con un certo ruolo
 * @param {string} callerRole - Ruolo dell'utente chiamante
 * @param {string} newRole - Ruolo da assegnare al nuovo utente
 * @returns {boolean}
 */
function canCreateUserWithRole(callerRole, newRole) {
    // Superuser può creare chiunque
    if (isSuperUser(callerRole)) {
        return true;
    }

    // Admin può creare solo operatori
    if (isAdmin(callerRole)) {
        return newRole === 'operatore';
    }

    return false;
}

module.exports = {
    getUserRole,
    isSuperUser,
    isAdmin,
    isOperator,
    requireAuth,
    requireSuperUser,
    requireAdmin,
    requireOperator,
    canManageUser,
    canCreateUserWithRole
};
