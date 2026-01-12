import { HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { COLLECTIONS } from "../../shared/constants/collections.ts";

// Normalizza il campo ruolo (può essere string o array) in un array di stringhe
export function normalizeRoles(ruoloField) {
    if (Array.isArray(ruoloField)) {
        return ruoloField.filter(r => typeof r === 'string' && r.trim().length > 0);
    }
    if (typeof ruoloField === 'string' && ruoloField.trim().length > 0) {
        return [ruoloField.trim()];
    }
    return [];
}

/**
 * Ottiene il ruolo principale dell'utente da Firestore
 * Restituisce il primo ruolo disponibile oppure null.
 * @param {string} uid - UID dell'utente
 * @returns {Promise<string|null>} Il ruolo dell'utente o null se non trovato
 */
export async function getUserRole(uid) {
    try {
        const db = admin.firestore();
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();

        if (!userDoc.exists) {
            console.warn(`Utente ${uid} non trovato in collezione users`);
            return null;
        }

        const roles = normalizeRoles(userDoc.data().ruolo);
        const primaryRole = roles[0] || null;

        return primaryRole;
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
export function isSuperUser(ruolo) {
    return normalizeRoles(ruolo).includes('superuser');
}

/**
 * Verifica se un ruolo è admin o superiore
 * @param {string} ruolo - Ruolo da verificare
 * @returns {boolean}
 */
export function isAdmin(ruolo) {
    const roles = normalizeRoles(ruolo);
    return roles.includes('admin') || roles.includes('superuser');
}

/**
 * Verifica se un ruolo è operatore o superiore
 * @param {string} ruolo - Ruolo da verificare
 * @returns {boolean}
 */
export function isOperator(ruolo) {
    const roles = normalizeRoles(ruolo);
    return roles.includes('operatore') || roles.includes('admin') || roles.includes('superuser');
}

/**
 * Middleware per richiedere autenticazione
 * @param {Object} request - Request object della Cloud Function
 * @throws {HttpsError} Se l'utente non è autenticato
 */
export function requireAuth(request) {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Devi essere autenticato per eseguire questa operazione.');
    }
}

/**
 * Middleware per richiedere ruolo superuser
 * @param {Object} request - Request object della Cloud Function
 * @throws {HttpsError} Se l'utente non è autenticato o non è superuser
 */
export async function requireSuperUser(request) {
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
export async function requireAdmin(request) {
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
export async function requireOperator(request) {
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
export function canManageUser(callerRole, targetRole) {
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
