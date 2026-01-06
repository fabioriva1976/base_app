/**
 * Factory functions condivise per creare entità con struttura consistente.
 * Fonte unica per frontend e backend (copiata in functions/schemas tramite script di sync).
 */

const nowIso = () => new Date().toISOString();

export function createDocumento({
  nome,
  tipo,
  storagePath,
  entityType = 'altro',
  entityId = null,
  createdBy = null,
  createdByEmail = null,
  metadata = {}
} = {}) {
  if (!nome || !tipo || !storagePath) {
    throw new Error('nome, tipo e storagePath sono obbligatori');
  }

  const baseMeta = createDocumentoMetadata(metadata);
  const timestamp = nowIso();

  return {
    nome: String(nome),
    tipo: String(tipo),
    storagePath: String(storagePath),
    entityType: entityType ? String(entityType) : 'altro',
    entityId: entityId ? String(entityId) : null,
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: createdBy ? String(createdBy) : null,
    createdByEmail: createdByEmail ? String(createdByEmail) : null,
    metadata: baseMeta
  };
}

export function createDocumentoMetadata({
  fonte = 'Upload Manuale',
  dimensione = 0,
  tags = [],
  titolo = '',
  descrizione = '',
  tipologia = '',
  stato = true,
  codiceRedazionale = ''
} = {}) {
  return {
    fonte: fonte ? String(fonte) : 'Upload Manuale',
    dimensione: Number(dimensione) || 0,
    tags: Array.isArray(tags) ? tags.map(String) : [],
    titolo: titolo ? String(titolo) : '',
    descrizione: descrizione ? String(descrizione) : '',
    tipologia: tipologia ? String(tipologia) : '',
    stato: Boolean(stato),
    codiceRedazionale: codiceRedazionale ? String(codiceRedazionale) : ''
  };
}

export function createCliente({
  ragione_sociale,
  email = null,
  telefono = null,
  codice = null,
  partita_iva = null,
  codice_fiscale = null,
  indirizzo = null,
  citta = null,
  cap = null,
  provincia = null,
  note = null,
  stato = true,
  createdBy = null,
  createdByEmail = null
} = {}) {
  if (!ragione_sociale) {
    throw new Error('ragione_sociale è obbligatorio');
  }

  const timestamp = nowIso();

  return {
    ragione_sociale: String(ragione_sociale),
    email: email ? String(email).toLowerCase() : null,
    telefono: telefono ? String(telefono) : null,
    codice: codice ? String(codice) : null,
    partita_iva: partita_iva ? String(partita_iva) : null,
    codice_fiscale: codice_fiscale ? String(codice_fiscale).toUpperCase() : null,
    indirizzo: indirizzo ? String(indirizzo) : null,
    citta: citta ? String(citta) : null,
    cap: cap ? String(cap) : null,
    provincia: provincia ? String(provincia) : null,
    note: note ? String(note) : null,
    stato: Boolean(stato),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: createdBy ? String(createdBy) : null,
    createdByEmail: createdByEmail ? String(createdByEmail).toLowerCase() : null
  };
}

export function createUtente({
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
