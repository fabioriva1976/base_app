/**
 * 🎯 PATTERN TEMPLATE: API CRUD per Entità "Comments"
 *
 * Questo file implementa il pattern standard CRUD per l'entità Comment.
 * Comments sono note/commenti associati ad altre entità (clienti, prodotti, etc.)
 *
 * Operazioni implementate:
 * - CREATE: createCommentApi (utenti autenticati)
 * - LIST: getEntityCommentsApi (utenti autenticati)
 * - DELETE: deleteCommentApi (solo admin o creatore del commento)
 *
 * Vedi: PATTERNS.md per la guida completa
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { region, corsOrigins } from "../config.js";
import { requireAuth } from "../utils/authHelpers.js";
import { createComment } from "../../shared/schemas/entityFactory.js";
import { logAudit, AuditAction } from "../utils/auditLogger.js";
import { COLLECTIONS } from "../../shared/constants/collections.js";
// 🔧 Inizializza Firebase Admin (singleton pattern)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// 📝 CONFIGURAZIONE: Nome collection in Firestore
const COLLECTION_NAME = COLLECTIONS.COMMENTS;
/**
 * 🎯 STEP 1: VALIDAZIONE
 *
 * Valida i dati di un commento prima di salvarlo.
 *
 * @param {object} data - I dati del commento da validare
 * @throws {HttpsError} Se i dati non sono validi
 */
function validateCommentData(data) {
    const required = ["text", "entityId", "entityCollection"];
    for (const field of required) {
        if (data[field] === undefined || data[field] === null || data[field] === "") {
            throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio`);
        }
    }
    // Validazione del testo
    if (typeof data.text !== 'string' || data.text.trim().length === 0) {
        throw new HttpsError("invalid-argument", "Il testo del commento non può essere vuoto");
    }
    if (data.text.length > 5000) {
        throw new HttpsError("invalid-argument", "Il testo del commento non può superare i 5000 caratteri");
    }
}
/**
 * API per creare un nuovo commento.
 *
 * Pattern CRUD Step-by-Step:
 * 1. SICUREZZA: Verifica permessi utente
 * 2. VALIDAZIONE: Controlla dati input
 * 3. BUSINESS LOGIC: Usa factory per creare oggetto
 * 4. DATABASE: Salva in Firestore
 * 5. LOGGING: Registra azione
 * 6. RESPONSE: Ritorna dati salvati
 */
export const createCommentApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // 1. SICUREZZA: Verifica che l'utente sia autenticato
    await requireAuth(request);
    const { uid, token } = request.auth;
    const data = request.data;
    try {
        // 2. VALIDAZIONE: Controlla che i dati siano validi
        validateCommentData(data);
        // 3. BUSINESS LOGIC: Usa la factory per creare l'oggetto comment con struttura consistente
        const nuovoComment = createComment({
            text: data.text,
            entityId: data.entityId,
            entityCollection: data.entityCollection,
            createdBy: uid,
            createdByEmail: token.email || null
        });
        // 3.1. TIMESTAMP: Sostituisce null con server timestamp
        nuovoComment.created = FieldValue.serverTimestamp();
        nuovoComment.changed = FieldValue.serverTimestamp();
        // 4. DATABASE: Salva in Firestore
        const docRef = await db.collection(COLLECTION_NAME).add(nuovoComment);
        // 5. LOGGING: Registra l'azione nell'audit log
        // Salva il log con riferimento all'entità parent per mostrarlo nel tab azioni
        await logAudit({
            entityType: nuovoComment.entityCollection,
            entityId: nuovoComment.entityId,
            action: AuditAction.CREATE,
            userId: uid,
            userEmail: token.email,
            newData: {
                commentId: docRef.id,
                commentText: nuovoComment.text
            },
            source: 'web',
            details: `Aggiunta nota: ${nuovoComment.text.substring(0, 50)}${nuovoComment.text.length > 50 ? '...' : ''}`
        });
        // 6. RESPONSE: Ritorna il commento salvato con il suo ID
        return {
            success: true,
            id: docRef.id,
            comment: nuovoComment
        };
    }
    catch (error) {
        console.error("Errore durante la creazione del commento:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile creare il commento.');
    }
});
/**
 * API per ottenere tutti i commenti di un'entità.
 */
export const getEntityCommentsApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAuth(request);
    const { entityId, entityCollection } = request.data;
    if (!entityId || !entityCollection) {
        throw new HttpsError("invalid-argument", "entityId e entityCollection sono obbligatori");
    }
    try {
        const snapshot = await db.collection(COLLECTION_NAME)
            .where("entityId", "==", entityId)
            .where("entityCollection", "==", entityCollection)
            .orderBy("created", "desc")
            .get();
        const comments = [];
        snapshot.forEach(doc => {
            comments.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return {
            success: true,
            comments: comments
        };
    }
    catch (error) {
        console.error("Errore durante il recupero dei commenti:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile recuperare i commenti.');
    }
});
/**
 * API per eliminare un commento.
 * Solo admin o il creatore del commento possono eliminarlo.
 */
export const deleteCommentApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAuth(request);
    const { uid, token } = request.auth;
    const { commentId } = request.data;
    if (!commentId) {
        throw new HttpsError("invalid-argument", "commentId è obbligatorio");
    }
    try {
        // 1. Recupera il commento esistente
        const docRef = db.collection(COLLECTION_NAME).doc(commentId);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new HttpsError("not-found", "Commento non trovato");
        }
        const oldData = doc.data();
        // 2. Verifica permessi: solo admin o creatore possono eliminare
        const isAdmin = token.admin === true;
        const isCreator = oldData.createdBy === uid;
        if (!isAdmin && !isCreator) {
            throw new HttpsError("permission-denied", "Solo l'admin o il creatore del commento può eliminarlo");
        }
        // 3. Elimina il commento
        await docRef.delete();
        // 4. LOGGING: Registra eliminazione
        await logAudit({
            entityType: oldData.entityCollection || COLLECTIONS.COMMENTS,
            entityId: oldData.entityId || commentId,
            action: AuditAction.DELETE,
            userId: uid,
            userEmail: token.email,
            oldData: {
                commentId: commentId,
                commentText: oldData.text
            },
            source: 'web',
            details: `Eliminata nota: ${oldData.text.substring(0, 50)}${oldData.text.length > 50 ? '...' : ''}`
        });
        return {
            success: true,
            message: "Commento eliminato con successo"
        };
    }
    catch (error) {
        console.error("Errore durante l'eliminazione del commento:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile eliminare il commento.');
    }
});
