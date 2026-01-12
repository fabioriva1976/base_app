/**
 * 🎯 PATTERN TEMPLATE: API CRUD per Entità "Attachments"
 *
 * Questo file implementa il pattern standard CRUD per l'entità Attachment.
 * Attachments sono file associati ad altre entità (clienti, prodotti, etc.)
 *
 * Operazioni implementate:
 * - CREATE: createAttachmentRecordApi (utenti autenticati)
 * - UPDATE: updateAttachmentApi (solo admin)
 * - DELETE: deleteAttachmentApi (solo admin, elimina anche file Storage)
 *
 * NOTA: Attachments è un'entità speciale che gestisce sia Firestore che Storage
 *
 * Vedi: PATTERNS.md per la guida completa
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { region, corsOrigins, runtimeOpts } from "../config.js";
import { requireAuth, requireAdmin } from "../utils/authHelpers.js";
import { createAttachment } from "../../shared/schemas/entityFactory.js";
import { logAudit, AuditAction } from "../utils/auditLogger.js";
import { COLLECTIONS } from "../../shared/constants/collections.js";
// 🔧 Inizializza Firebase Admin (singleton pattern)
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
const storage = admin.storage();
// 📝 CONFIGURAZIONE: Nome collection in Firestore
const COLLECTION_NAME = COLLECTIONS.ATTACHMENTS;
/**
 * 🎯 STEP 1: VALIDAZIONE
 *
 * Valida i dati di un documento prima di salvarli.
 * Per nuove entità: copia questa funzione e aggiorna i campi validati.
 *
 * @param {object} data - I dati del documento da validare
 * @throws {HttpsError} Se i dati non sono validi
 */
function validateAttachmentData(data) {
    const required = ["nome", "tipo", "storagePath", "metadata"];
    for (const field of required) {
        const value = data[field];
        if (value === undefined || value === null || value === "") {
            throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio`);
        }
    }
    // Validazione tipo file
    const tipo = data.tipo;
    if (typeof tipo !== 'string' || tipo.trim() === '') {
        throw new HttpsError('invalid-argument', 'Tipo file obbligatorio');
    }
    // Validazione storage path
    const storagePath = data.storagePath;
    if (typeof storagePath !== 'string' || storagePath.trim() === '') {
        throw new HttpsError('invalid-argument', 'Storage path obbligatorio');
    }
}
/**
 * 🎯 CREATE API: Crea nuovo documento
 *
 * Permessi richiesti: UTENTE AUTENTICATO
 * Input: { nome, tipo, storagePath, entityType?, entityId?, metadata }
 * Output: { id, ...dati documento }
 *
 * Pattern CRUD Step-by-Step:
 * 1. SICUREZZA: Verifica autenticazione utente
 * 2. VALIDAZIONE: Controlla dati input
 * 3. BUSINESS LOGIC: Usa factory per creare oggetto
 * 4. DATABASE: Salva in Firestore
 * 5. LOGGING: Registra azione
 * 6. RESPONSE: Ritorna dati salvati
 */
export const createAttachmentRecordApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
    // 1. SICUREZZA: Qualsiasi utente autenticato può creare un documento
    await requireAuth(request);
    const user = request.auth;
    if (!user) {
        throw new HttpsError('unauthenticated', 'Utente non autenticato.');
    }
    const data = (request.data || {});
    try {
        // 2. VALIDAZIONE: Controlla che i dati inviati siano validi
        validateAttachmentData(data);
        // 3. BUSINESS LOGIC: Crea l'oggetto documento usando la factory condivisa
        const nuovoAttachment = createAttachment({
            ...data,
            createdBy: user.uid,
            createdByEmail: user.token?.email ?? null,
        });
        // 3.1. TIMESTAMP: Sostituisce null con server timestamp
        const attachmentToSave = {
            ...nuovoAttachment,
            created: FieldValue.serverTimestamp(),
            changed: FieldValue.serverTimestamp()
        };
        // 4. DATABASE: Salva il nuovo documento in Firestore
        const docRef = await db.collection(COLLECTION_NAME).add(attachmentToSave);
        // 5. AUDIT LOG: Registra creazione documento
        // Salva il log con riferimento all'entità parent per mostrarlo nel tab azioni
        await logAudit({
            entityType: nuovoAttachment.metadata.entityCollection || COLLECTIONS.ATTACHMENTS,
            entityId: nuovoAttachment.metadata.entityId || docRef.id,
            action: AuditAction.CREATE,
            userId: user.uid,
            userEmail: user.token?.email ?? null,
            newData: {
                attachmentId: docRef.id,
                attachmentName: nuovoAttachment.nome,
                attachmentType: nuovoAttachment.tipo,
                ...nuovoAttachment.metadata
            },
            source: 'web',
            details: `Caricato file: ${nuovoAttachment.nome}`
        });
        console.log(`Utente ${user.uid} ha creato il record documento ${docRef.id}`);
        // 6. RESPONSE: Ritorna dati salvati
        return { success: true, id: docRef.id, ...nuovoAttachment };
    }
    catch (error) {
        console.error("Errore durante la creazione del record documento:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile creare il record del documento.');
    }
});
/**
 * 🎯 DELETE API: Elimina documento
 *
 * Permessi richiesti: ADMIN
 * Input: { docId, storagePath }
 * Output: { success: true }
 *
 * NOTA: Elimina sia record Firestore che file fisico da Storage
 */
export const deleteAttachmentApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
    // 1. SICUREZZA: Solo gli admin possono eliminare documenti
    await requireAdmin(request);
    const auth = request.auth;
    if (!auth) {
        throw new HttpsError('unauthenticated', 'Utente non autenticato.');
    }
    const { uid } = auth;
    const { docId, storagePath } = request.data || {};
    if (!docId || !storagePath) {
        throw new HttpsError("invalid-argument", "docId e storagePath sono obbligatori");
    }
    // 2. DATABASE: Recupera dati e elimina il record da Firestore
    let oldData = null;
    try {
        const docRef = db.collection(COLLECTION_NAME).doc(docId);
        const docSnapshot = await docRef.get();
        oldData = docSnapshot.exists ? docSnapshot.data() : null;
        await docRef.delete();
        console.log(`Utente ${uid} ha eliminato il record documento ${docId} da Firestore.`);
    }
    catch (err) {
        console.error("Errore cancellazione documento in Firestore:", err);
        throw new HttpsError("internal", "Impossibile cancellare il documento");
    }
    // 3. STORAGE: Elimina il file fisico
    try {
        const bucket = storage.bucket();
        await bucket.file(storagePath).delete({ ignoreNotFound: true });
        console.log(`Utente ${uid} ha eliminato il file ${storagePath} da Storage.`);
    }
    catch (err) {
        console.error("Errore cancellazione file Storage:", err);
        // Non rilanciamo l'errore per non bloccare l'operazione se il record DB è già stato rimosso,
        // ma è importante loggarlo per un'eventuale pulizia manuale (orphaned files).
    }
    // AUDIT LOG: Registra eliminazione documento
    // Salva il log con riferimento all'entità parent per mostrarlo nel tab azioni
    await logAudit({
        entityType: oldData?.metadata?.entityCollection || COLLECTIONS.ATTACHMENTS,
        entityId: oldData?.metadata?.entityId || docId,
        action: AuditAction.DELETE,
        userId: uid,
        userEmail: auth.token?.email ?? null,
        oldData: {
            attachmentId: docId,
            attachmentName: oldData?.nome || 'File',
            attachmentType: oldData?.tipo || '',
            ...oldData?.metadata
        },
        metadata: { storagePath: storagePath },
        source: 'web',
        details: `Eliminato file: ${oldData?.nome || 'File'}`
    });
    return { success: true };
});
/**
 * 🎯 UPDATE API: Aggiorna metadati documento
 *
 * Permessi richiesti: ADMIN
 * Input: { id, ...updateData }
 * Output: { message }
 */
export const updateAttachmentApi = onCall({ region, cors: corsOrigins, ...runtimeOpts }, async (request) => {
    // 1. SICUREZZA: Solo admin possono modificare documenti
    await requireAdmin(request);
    const auth = request.auth;
    if (!auth) {
        throw new HttpsError('unauthenticated', 'Utente non autenticato.');
    }
    const { uid } = auth;
    const data = (request.data || {});
    const id = data.id;
    const updateData = { ...data };
    delete updateData.id;
    if (!id) {
        throw new HttpsError("invalid-argument", "L'ID del documento è obbligatorio.");
    }
    try {
        const docRef = db.collection(COLLECTION_NAME).doc(id);
        // Recupera dati attuali per audit
        const oldDoc = await docRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;
        // 2. DATABASE: Aggiunge timestamp di aggiornamento e audit fields
        const dataToUpdate = {
            ...updateData,
            changed: FieldValue.serverTimestamp(),
            lastModifiedBy: uid,
            lastModifiedByEmail: auth.token?.email ?? null
        };
        await docRef.update(dataToUpdate);
        // AUDIT LOG: Registra modifica documento
        await logAudit({
            entityType: COLLECTIONS.ATTACHMENTS,
            entityId: id,
            action: AuditAction.UPDATE,
            userId: uid,
            userEmail: auth.token?.email ?? null,
            oldData: oldData,
            newData: dataToUpdate,
            source: 'web'
        });
        // 3. LOGGING: Registra azione
        console.log(`Utente ${uid} ha aggiornato il documento ${id}`);
        return { message: "Documento aggiornato con successo." };
    }
    catch (error) {
        console.error(`Errore durante l'aggiornamento del documento ${id}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile aggiornare il documento.');
    }
});
