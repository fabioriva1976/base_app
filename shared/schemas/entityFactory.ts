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

import {
  AttachmentSchema,
  ClienteSchema,
  CommentSchema,
  UtenteSchema,
  type AttachmentInput,
  type ClienteInput,
  type CommentInput,
  type UtenteInput
} from './zodSchemas.ts';

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
export const SERVER_TIMESTAMP: TimestampPlaceholder = null;

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
 * 🎯 Helper: Normalizza campi audit
 *
 * Se createdBy/Email non sono forniti, usa valori SYSTEM.
 * Questo garantisce che ogni entità abbia sempre informazioni di audit tracciabili.
 *
 * @param {string|null} createdBy - UID utente o null per sistema
 * @param {string|null} createdByEmail - Email utente o null per sistema
 * @returns {object} Oggetto con createdBy, createdByEmail, lastModifiedBy, lastModifiedByEmail
 */
function normalizeAuditFields(createdBy: NullableString, createdByEmail: NullableString): AuditFields {
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
export function createAttachment({
  nome,
  tipo,
  storagePath,
  metadata = {},
  createdBy = null,
  createdByEmail = null
}: AttachmentFactoryInput = {}): AttachmentEntity {
  const parsed = AttachmentSchema.parse({
    nome,
    tipo,
    storagePath,
    metadata
  });

  const auditFields = normalizeAuditFields(createdBy, createdByEmail);

  return {
    nome: parsed.nome,
    tipo: parsed.tipo,
    storagePath: parsed.storagePath,
    metadata: createAttachmentMetadata(parsed.metadata),
    created: SERVER_TIMESTAMP,
    changed: SERVER_TIMESTAMP,
    createdBy: auditFields.createdBy,
    createdByEmail: auditFields.createdByEmail,
    lastModifiedBy: auditFields.lastModifiedBy,
    lastModifiedByEmail: auditFields.lastModifiedByEmail
  };
}

export function createAttachmentMetadata({
  entityId = null,
  entityCollection = null,
  url = '',
  size = 0,
  description = ''
}: AttachmentMetadataInput = {}): AttachmentMetadata {
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
export function createCliente({
  ragione_sociale,
  codice,
  email = null,
  telefono = null,
  partita_iva = null,
  codice_fiscale = null,
  indirizzo = null,
  citta = null,
  cap = null,
  provincia = null,
  note = null,
  status,
  createdBy = null,
  createdByEmail = null
}: ClienteFactoryInput = {}): ClienteEntity {
  const parsed = ClienteSchema.parse({
    ragione_sociale,
    codice,
    email,
    telefono,
    partita_iva,
    codice_fiscale,
    indirizzo,
    citta,
    cap,
    provincia,
    note,
    status
  });

  const auditFields = normalizeAuditFields(createdBy, createdByEmail);

  return {
    ragione_sociale: parsed.ragione_sociale,
    codice: parsed.codice,
    email: parsed.email ?? null,
    telefono: parsed.telefono ?? null,
    partita_iva: parsed.partita_iva ?? null,
    codice_fiscale: parsed.codice_fiscale ?? null,
    indirizzo: parsed.indirizzo ?? null,
    citta: parsed.citta ?? null,
    cap: parsed.cap ?? null,
    provincia: parsed.provincia ?? null,
    note: parsed.note ?? null,
    status: parsed.status,
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
export function createUtente({
  uid,
  email,
  ruolo,
  displayName,
  disabled,
  photoURL,
  metadata,
  createdBy = null,
  createdByEmail = null
}: UtenteFactoryInput = {}): UtenteEntity {
  const parsed = UtenteSchema.parse({
    uid,
    email,
    ruolo: ruolo ?? 'operatore',
    displayName,
    disabled,
    photoURL,
    metadata
  });

  const auditFields = normalizeAuditFields(createdBy, createdByEmail);

  return {
    uid: parsed.uid,
    email: parsed.email,
    ruolo: Array.isArray(parsed.ruolo) ? parsed.ruolo : [parsed.ruolo],
    displayName: parsed.displayName,
    disabled: parsed.disabled,
    photoURL: parsed.photoURL ?? null,
    metadata: parsed.metadata,
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
export function createComment({
  text,
  entityId,
  entityCollection,
  createdBy = null,
  createdByEmail = null
}: CommentFactoryInput = {}): CommentEntity {
  const parsed = CommentSchema.parse({
    text,
    entityId,
    entityCollection
  });

  const auditFields = normalizeAuditFields(createdBy, createdByEmail);

  return {
    text: parsed.text,
    entityId: parsed.entityId,
    entityCollection: parsed.entityCollection,
    created: SERVER_TIMESTAMP,
    changed: SERVER_TIMESTAMP,
    createdBy: auditFields.createdBy,
    createdByEmail: auditFields.createdByEmail,
    lastModifiedBy: auditFields.lastModifiedBy,
    lastModifiedByEmail: auditFields.lastModifiedByEmail
  };
}
