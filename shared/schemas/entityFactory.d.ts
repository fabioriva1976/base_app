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
import { type AttachmentInput, type ClienteInput, type CommentInput, type UtenteInput } from './zodSchemas.ts';
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
export declare const SERVER_TIMESTAMP: TimestampPlaceholder;
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
export declare const SYSTEM_USER: {
    id: string;
    email: string;
};
type NullableString = string | null;
type TimestampPlaceholder = null | unknown;
interface AuditFields {
    createdBy: string;
    createdByEmail: string;
    lastModifiedBy: string;
    lastModifiedByEmail: string;
}
interface AttachmentMetadataInput {
    entityId?: NullableString;
    entityCollection?: NullableString;
    url?: string;
    size?: number;
    description?: string;
}
interface AttachmentMetadata {
    entityId: NullableString;
    entityCollection: NullableString;
    url: string;
    size: number;
    description: string;
}
type AttachmentFactoryInput = Partial<Omit<AttachmentInput, 'metadata'>> & {
    metadata?: AttachmentMetadataInput;
    createdBy?: NullableString;
    createdByEmail?: NullableString;
};
interface AttachmentEntity extends AuditFields {
    nome: string;
    tipo: string;
    storagePath: string;
    metadata: AttachmentMetadata;
    created: TimestampPlaceholder;
    changed: TimestampPlaceholder;
}
type ClienteFactoryInput = Partial<ClienteInput> & {
    createdBy?: NullableString;
    createdByEmail?: NullableString;
};
interface ClienteEntity extends AuditFields {
    ragione_sociale: string;
    codice: string;
    email: NullableString;
    telefono: NullableString;
    partita_iva: NullableString;
    codice_fiscale: NullableString;
    indirizzo: NullableString;
    citta: NullableString;
    cap: NullableString;
    provincia: NullableString;
    note: NullableString;
    status: boolean;
    created: TimestampPlaceholder;
    changed: TimestampPlaceholder;
}
type UtenteFactoryInput = Partial<UtenteInput> & {
    createdBy?: NullableString;
    createdByEmail?: NullableString;
};
interface UtenteEntity extends AuditFields {
    uid: string;
    email: string;
    ruolo: string[];
    displayName: string;
    disabled: boolean;
    photoURL: NullableString;
    metadata: Record<string, unknown>;
    created: TimestampPlaceholder;
    changed: TimestampPlaceholder;
}
type CommentFactoryInput = Partial<CommentInput> & {
    createdBy?: NullableString;
    createdByEmail?: NullableString;
};
interface CommentEntity extends AuditFields {
    text: string;
    entityId: string;
    entityCollection: string;
    created: TimestampPlaceholder;
    changed: TimestampPlaceholder;
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
export declare function createAttachment({ nome, tipo, storagePath, metadata, createdBy, createdByEmail }?: AttachmentFactoryInput): AttachmentEntity;
export declare function createAttachmentMetadata({ entityId, entityCollection, url, size, description }?: AttachmentMetadataInput): AttachmentMetadata;
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
export declare function createCliente({ ragione_sociale, codice, email, telefono, partita_iva, codice_fiscale, indirizzo, citta, cap, provincia, note, status, createdBy, createdByEmail }?: ClienteFactoryInput): ClienteEntity;
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
export declare function createUtente({ uid, email, ruolo, displayName, disabled, photoURL, metadata, createdBy, createdByEmail }?: UtenteFactoryInput): UtenteEntity;
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
export declare function createComment({ text, entityId, entityCollection, createdBy, createdByEmail }?: CommentFactoryInput): CommentEntity;
export {};
