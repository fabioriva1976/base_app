/**
 * Factory functions per creare entità con struttura consistente.
 *
 * NOTA: Questo file è AUTO-GENERATO da /shared/schemas/entityFactory.ts
 * Non modificare direttamente questo file! Modifica il file sorgente e riesegui:
 * npm run sync-factories
 */
/**
 * Factory functions condivise per creare entità con struttura consistente.
 * Fonte unica per frontend e backend (copiata in functions/schemas tramite script di sync).
 *
 * 🕐 STRATEGIA TIMESTAMP:
 * - Factory: Ritornano `null` per created/changed
 * - Backend API: Sostituiscono null con FieldValue.serverTimestamp() prima di salvare
 * - Questo garantisce timestamp server-side consistenti e sicuri
 *
 * MOTIVAZIONE:
 * - Client timestamp può essere manipolato (clock locale errato)
 * - FieldValue.serverTimestamp() garantisce timestamp server affidabile
 * - null è placeholder che indica "usa server timestamp"
 */
/**
 * Placeholder per timestamp che deve essere sostituito con FieldValue.serverTimestamp()
 * quando si salva in Firestore.
 *
 * @constant {null}
 * @example
 * // In factory
 * created: SERVER_TIMESTAMP,  // null
 *
 * // In API backend prima di salvare
 * const entityData = createCliente({...});
 * entityData.created = FieldValue.serverTimestamp();
 * await db.collection('clienti').add(entityData);
 */
export const SERVER_TIMESTAMP = null;
/**
 * 🤖 COSTANTI PER OPERAZIONI DI SISTEMA
 *
 * Quando un'entità viene creata/modificata da processi automatici (cron, trigger, migration)
 * invece che da utenti umani, usa questi valori per i campi audit.
 *
 * Nel frontend puoi identificare operazioni di sistema controllando:
 * - lastModifiedBy === 'SYSTEM'
 * - lastModifiedByEmail === 'system@internal'
 */
export const SYSTEM_USER = {
    id: 'SYSTEM',
    email: 'system@internal'
};
/**
 * 🎯 Helper: Normalizza campi audit
 *
 * Se createdBy/Email non sono forniti, usa valori SYSTEM.
 * Questo garantisce che ogni entità abbia sempre informazioni di audit tracciabili.
 *
 * @param {string|null} createdBy - UID utente o null per sistema
 * @param {string|null} createdByEmail - Email utente o null per sistema
 * @returns {object} Oggetto con createdBy, createdByEmail, lastModifiedBy, lastModifiedByEmail
 */
function normalizeAuditFields(createdBy, createdByEmail) {
    const userId = createdBy ? String(createdBy) : SYSTEM_USER.id;
    const userEmail = createdByEmail ? String(createdByEmail).toLowerCase() : SYSTEM_USER.email;
    return {
        createdBy: userId,
        createdByEmail: userEmail,
        lastModifiedBy: userId,
        lastModifiedByEmail: userEmail
    };
}
/**
 * 📎 Factory: Attachment
 *
 * Crea un attachment (documento/file) associato a un'entità.
 *
 * @param {object} params - Parametri attachment
 * @param {string} params.nome - Nome file
 * @param {string} params.tipo - MIME type (es: 'application/pdf')
 * @param {string} params.storagePath - Path in Firebase Storage
 * @param {object} params.metadata - Metadata aggiuntivi (entityId, entityCollection, etc)
 * @param {string|null} params.createdBy - UID utente creatore (null = SYSTEM)
 * @param {string|null} params.createdByEmail - Email utente creatore (null = SYSTEM)
 * @returns {object} Oggetto attachment validato
 */
export function createAttachment({ nome, tipo, storagePath, metadata = {}, createdBy = null, createdByEmail = null } = {}) {
    if (!nome || !tipo || !storagePath) {
        throw new Error('nome, tipo e storagePath sono obbligatori');
    }
    const auditFields = normalizeAuditFields(createdBy, createdByEmail);
    return {
        nome: String(nome),
        tipo: String(tipo),
        storagePath: String(storagePath),
        metadata: {
            entityId: metadata.entityId ? String(metadata.entityId) : null,
            entityCollection: metadata.entityCollection ? String(metadata.entityCollection) : null,
            url: metadata.url ? String(metadata.url) : '',
            size: Number(metadata.size) || 0,
            description: metadata.description ? String(metadata.description) : ''
        },
        created: SERVER_TIMESTAMP,
        changed: SERVER_TIMESTAMP,
        createdBy: auditFields.createdBy,
        createdByEmail: auditFields.createdByEmail,
        lastModifiedBy: auditFields.lastModifiedBy,
        lastModifiedByEmail: auditFields.lastModifiedByEmail
    };
}
export function createAttachmentMetadata({ entityId = null, entityCollection = null, url = '', size = 0, description = '' } = {}) {
    return {
        entityId: entityId ? String(entityId) : null,
        entityCollection: entityCollection ? String(entityCollection) : null,
        url: url ? String(url) : '',
        size: Number(size) || 0,
        description: description ? String(description) : ''
    };
}
/**
 * 👥 Factory: Cliente
 *
 * Crea un cliente nell'anagrafica con campi validati.
 *
 * @param {object} params - Parametri cliente
 * @param {string} params.ragione_sociale - Ragione sociale (obbligatorio)
 * @param {string} params.codice - Codice cliente univoco (obbligatorio)
 * @param {string|null} params.email - Email cliente
 * @param {string|null} params.telefono - Telefono cliente
 * @param {string|null} params.partita_iva - Partita IVA
 * @param {string|null} params.codice_fiscale - Codice fiscale
 * @param {string|null} params.indirizzo - Indirizzo
 * @param {string|null} params.citta - Città
 * @param {string|null} params.cap - CAP
 * @param {string|null} params.provincia - Provincia
 * @param {string|null} params.note - Note aggiuntive
 * @param {boolean} params.status - Attivo/Disattivo (default: true)
 * @param {string|null} params.createdBy - UID utente creatore (null = SYSTEM)
 * @param {string|null} params.createdByEmail - Email utente creatore (null = SYSTEM)
 * @returns {object} Oggetto cliente validato
 */
export function createCliente({ ragione_sociale, codice, email = null, telefono = null, partita_iva = null, codice_fiscale = null, indirizzo = null, citta = null, cap = null, provincia = null, note = null, status = true, createdBy = null, createdByEmail = null } = {}) {
    if (!ragione_sociale) {
        throw new Error('ragione_sociale è obbligatorio');
    }
    if (!codice) {
        throw new Error('codice è obbligatorio');
    }
    const auditFields = normalizeAuditFields(createdBy, createdByEmail);
    return {
        ragione_sociale: String(ragione_sociale),
        codice: String(codice),
        email: email ? String(email).toLowerCase() : null,
        telefono: telefono ? String(telefono) : null,
        partita_iva: partita_iva ? String(partita_iva) : null,
        codice_fiscale: codice_fiscale ? String(codice_fiscale).toUpperCase() : null,
        indirizzo: indirizzo ? String(indirizzo) : null,
        citta: citta ? String(citta) : null,
        cap: cap ? String(cap) : null,
        provincia: provincia ? String(provincia) : null,
        note: note ? String(note) : null,
        status: Boolean(status),
        created: SERVER_TIMESTAMP,
        changed: SERVER_TIMESTAMP,
        createdBy: auditFields.createdBy,
        createdByEmail: auditFields.createdByEmail,
        lastModifiedBy: auditFields.lastModifiedBy,
        lastModifiedByEmail: auditFields.lastModifiedByEmail
    };
}
/**
 * 👤 Factory: Utente
 *
 * Crea un utente con metadati Firestore (separato da Firebase Auth).
 *
 * @param {object} params - Parametri utente
 * @param {string} params.uid - UID Firebase Auth
 * @param {string} params.email - Email utente
 * @param {string|string[]} params.ruolo - Ruolo/i utente (operatore, admin, superuser)
 * @param {string} params.displayName - Nome visualizzato
 * @param {boolean} params.disabled - Account disabilitato
 * @param {string|null} params.photoURL - URL foto profilo
 * @param {object} params.metadata - Metadati aggiuntivi
 * @param {string|null} params.createdBy - UID utente creatore (null = SYSTEM)
 * @param {string|null} params.createdByEmail - Email utente creatore (null = SYSTEM)
 * @returns {object} Oggetto utente validato
 */
export function createUtente({ uid, email, ruolo = 'operatore', displayName = '', disabled = false, photoURL = null, metadata = {}, createdBy = null, createdByEmail = null } = {}) {
    if (!uid || !email) {
        throw new Error('uid ed email sono obbligatori');
    }
    const auditFields = normalizeAuditFields(createdBy, createdByEmail);
    return {
        uid: String(uid),
        email: String(email).toLowerCase(),
        ruolo: Array.isArray(ruolo) ? ruolo.map(String) : [String(ruolo)],
        displayName: displayName ? String(displayName) : '',
        disabled: Boolean(disabled),
        photoURL: photoURL ? String(photoURL) : null,
        metadata: metadata && typeof metadata === 'object' ? { ...metadata } : {},
        created: SERVER_TIMESTAMP,
        changed: SERVER_TIMESTAMP,
        createdBy: auditFields.createdBy,
        createdByEmail: auditFields.createdByEmail,
        lastModifiedBy: auditFields.lastModifiedBy,
        lastModifiedByEmail: auditFields.lastModifiedByEmail
    };
}
/**
 * 💬 Factory: Comment
 *
 * Crea un commento/nota associato a un'entità.
 *
 * @param {object} params - Parametri comment
 * @param {string} params.text - Testo del commento
 * @param {string} params.entityId - ID entità associata
 * @param {string} params.entityCollection - Collection entità (es: 'clienti')
 * @param {string|null} params.createdBy - UID utente creatore (null = SYSTEM)
 * @param {string|null} params.createdByEmail - Email utente creatore (null = SYSTEM)
 * @returns {object} Oggetto comment validato
 */
export function createComment({ text, entityId, entityCollection, createdBy = null, createdByEmail = null } = {}) {
    if (!text || !entityId || !entityCollection) {
        throw new Error('text, entityId e entityCollection sono obbligatori');
    }
    const auditFields = normalizeAuditFields(createdBy, createdByEmail);
    return {
        text: String(text),
        entityId: String(entityId),
        entityCollection: String(entityCollection),
        created: SERVER_TIMESTAMP,
        changed: SERVER_TIMESTAMP,
        createdBy: auditFields.createdBy,
        createdByEmail: auditFields.createdByEmail,
        lastModifiedBy: auditFields.lastModifiedBy,
        lastModifiedByEmail: auditFields.lastModifiedByEmail
    };
}
