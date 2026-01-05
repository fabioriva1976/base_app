/**
 * Factory functions per creare entità con struttura consistente (client-side)
 * Basate sugli schemi JSON in /schemas
 */

/**
 * Crea un oggetto Documento con la struttura standard
 * @param {Object} params - Parametri del documento
 * @param {string} params.titolo - Titolo del documento
 * @param {string} params.tipo - MIME type
 * @param {string} params.storagePath - Percorso in Storage
 * @param {string} [params.entityType] - Tipo entità collegata
 * @param {string} [params.entityId] - ID entità collegata
 * @param {string} [params.createdBy] - UID utente creatore
 * @param {string} [params.createdByEmail] - Email utente creatore
 * @param {Object} [params.metadata] - Metadati aggiuntivi
 * @returns {Object} Documento con struttura standard
 */
export function createDocumento({
  titolo,
  tipo,
  storagePath,
  entityType = null,
  entityId = null,
  createdBy = null,
  createdByEmail = null,
  metadata = {}
}) {
  const now = new Date().toISOString();

  return {
    titolo,
    tipo,
    storagePath,
    entityType,
    entityId,
    createdAt: now,
    updatedAt: now,
    createdBy,
    createdByEmail,
    metadata
  };
}

/**
 * Crea un oggetto Legge con la struttura standard
 * @param {Object} params - Parametri della legge
 * @param {string} params.codiceRedazionale - Codice redazionale
 * @param {string} params.dataGU - Data pubblicazione GU
 * @param {string} params.numeroAtto - Numero atto
 * @param {string} params.titolo - Titolo
 * @param {string} [params.storageFilePath] - Percorso file in Storage
 * @param {string} [params.stato] - Stato download
 * @returns {Object} Legge con struttura standard
 */
export function createLegge({
  codiceRedazionale,
  dataGU,
  numeroAtto,
  titolo,
  storageFilePath = null,
  stato = "scaricato"
}) {
  return {
    codiceRedazionale,
    dataGU,
    numeroAtto,
    titolo,
    dataDownload: new Date().toISOString(),
    stato,
    storageFilePath
  };
}

/**
 * Crea metadati per un documento di tipo Legge
 * @param {Object} params - Parametri metadati
 * @param {string} params.codiceRedazionale - Codice redazionale
 * @param {string} [params.fonte] - Fonte (default: 'Normattiva')
 * @param {number} [params.dimensione] - Dimensione file
 * @param {Array<string>} [params.tags] - Tag aggiuntivi
 * @returns {Object} Metadati documento legge
 */
export function createLeggeMetadata({
  codiceRedazionale,
  fonte = "Normattiva",
  dimensione = 0,
  tags = []
}) {
  return {
    codiceRedazionale,
    fonte,
    dimensione,
    tags
  };
}

/**
 * Crea metadati per un documento generico caricato da utente
 * @param {Object} params - Parametri metadati
 * @param {string} [params.fonte] - Fonte del documento
 * @param {number} [params.dimensione] - Dimensione file
 * @param {Array<string>} [params.tags] - Tag per categorizzare
 * @param {string} [params.titolo] - Titolo del documento
 * @param {string} [params.descrizione] - Descrizione del documento
 * @param {string} [params.tipologia] - Tipologia del documento
 * @param {boolean} [params.stato] - Stato attivo/inattivo
 * @returns {Object} Metadati documento
 */
export function createDocumentoMetadata({
  fonte = "Upload Manuale",
  dimensione = 0,
  tags = [],
  titolo = '',
  descrizione = '',
  tipologia = '',
  stato = true
}) {
  return {
    fonte,
    dimensione,
    tags,
    titolo,
    descrizione,
    tipologia,
    stato
  };
}
