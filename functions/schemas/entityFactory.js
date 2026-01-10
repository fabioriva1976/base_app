/**
 * Factory functions per creare entità con struttura consistente
 *
 * NOTA: Questo file è AUTO-GENERATO da /shared/schemas/entityFactory.js
 * Non modificare direttamente questo file! Modifica il file sorgente e riesegui:
 * npm run sync-factories
 *
 * Mantiene la stessa logica ma usa CommonJS (module.exports) invece di ES6 modules (export)
 * per compatibilità con le Cloud Functions Node.js.
 */

const nowIso = () => new Date().toISOString();

function createAttachment({
  nome,
  tipo,
  storagePath,
  metadata = {},
  createdBy = null,
  createdByEmail = null
} = {}) {
  if (!nome || !tipo || !storagePath) {
    throw new Error('nome, tipo e storagePath sono obbligatori');
  }

  const timestamp = nowIso();

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
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: createdBy ? String(createdBy) : null,
    createdByEmail: createdByEmail ? String(createdByEmail) : null
  };
}

function createAttachmentMetadata({
  entityId = null,
  entityCollection = null,
  url = '',
  size = 0,
  description = ''
} = {}) {
  return {
    entityId: entityId ? String(entityId) : null,
    entityCollection: entityCollection ? String(entityCollection) : null,
    url: url ? String(url) : '',
    size: Number(size) || 0,
    description: description ? String(description) : ''
  };
}

function createCliente({
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
  status = true,
  createdBy = null,
  createdByEmail = null
} = {}) {
  if (!ragione_sociale) {
    throw new Error('ragione_sociale è obbligatorio');
  }
  if (!codice) {
    throw new Error('codice è obbligatorio');
  }

  const timestamp = nowIso();
  const createdByValue = createdBy ? String(createdBy) : null;
  const createdByEmailValue = createdByEmail ? String(createdByEmail).toLowerCase() : null;

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
    created: timestamp,
    changed: timestamp,
    lastModifiedBy: createdByValue,
    lastModifiedByEmail: createdByEmailValue
  };
}

function createUtente({
  uid,
  email,
  ruolo = 'operatore',
  displayName = '',
  disabled = false,
  photoURL = null,
  metadata = {},
  createdBy = null,
  createdByEmail = null
} = {}) {
  if (!uid || !email) {
    throw new Error('uid ed email sono obbligatori');
  }

  const timestamp = nowIso();

  return {
    uid: String(uid),
    email: String(email).toLowerCase(),
    ruolo: Array.isArray(ruolo) ? ruolo.map(String) : [String(ruolo)],
    displayName: displayName ? String(displayName) : '',
    disabled: Boolean(disabled),
    photoURL: photoURL ? String(photoURL) : null,
    metadata: metadata && typeof metadata === 'object' ? { ...metadata } : {},
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: createdBy ? String(createdBy) : null,
    createdByEmail: createdByEmail ? String(createdByEmail).toLowerCase() : null
  };
}

function createComment({
  text,
  entityId,
  entityCollection,
  createdBy = null,
  createdByEmail = null
} = {}) {
  if (!text || !entityId || !entityCollection) {
    throw new Error('text, entityId e entityCollection sono obbligatori');
  }

  const timestamp = nowIso();

  return {
    text: String(text),
    entityId: String(entityId),
    entityCollection: String(entityCollection),
    createdAt: timestamp,
    createdBy: createdBy ? String(createdBy) : null,
    createdByEmail: createdByEmail ? String(createdByEmail) : null
  };
}

module.exports = {
  createAttachment,
  createAttachmentMetadata,
  createCliente,
  createUtente,
  createComment,
};
