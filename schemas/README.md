# Schemi Dati - Legal Assistant

Questa directory contiene gli schemi JSON e le factory functions per garantire la consistenza delle strutture dati in tutto il progetto.

## Struttura Standard

### Collezione `documenti`

Tutti i documenti (sia caricati manualmente che scaricati automaticamente) seguono questa struttura:

```json
{
  "nome": "string - Nome del file (es: 'Contratto.pdf', 'Legge 123.txt')",
  "tipo": "string - MIME type (es: 'application/pdf', 'text/plain')",
  "storagePath": "string - Percorso in Firebase Storage (es: 'documenti/file.pdf', 'leggi/025U0081.txt')",
  "entityType": "string - Tipo entità collegata ('pratiche', 'clienti', 'utenti', 'leggi', 'altro')",
  "entityId": "string|null - ID dell'entità collegata",
  "createdAt": "string - Data creazione ISO 8601",
  "updatedAt": "string - Data ultimo aggiornamento ISO 8601",
  "createdBy": "string|null - UID utente creatore",
  "createdByEmail": "string|null - Email utente creatore",
  "metadata": {
    "fonte": "string - Fonte del documento (es: 'Normattiva', 'Upload Manuale')",
    "dimensione": "number - Dimensione file in bytes",
    "tags": "array - Tag per categorizzazione",

    // Campi specifici per documenti caricati manualmente
    "titolo": "string - Titolo del documento",
    "descrizione": "string - Descrizione del documento",
    "tipologia": "string - Tipologia del documento",
    "stato": "boolean - Stato attivo/inattivo",

    // Campi specifici per leggi da Normattiva
    "codiceRedazionale": "string - Codice redazionale della legge"
  }
}
```

### Collezione `leggi`

Metadati delle leggi scaricate da Normattiva:

```json
{
  "codiceRedazionale": "string - Codice redazionale (es: '025U0081')",
  "dataGU": "string - Data pubblicazione Gazzetta Ufficiale (ISO)",
  "numeroAtto": "string - Numero dell'atto",
  "titolo": "string - Titolo della legge",
  "dataDownload": "string - Data download (ISO 8601)",
  "stato": "string - Stato ('scaricato', 'errore', 'in_elaborazione')",
  "storageFilePath": "string - Percorso file .txt in Storage (es: 'leggi/025U0081.txt')"
}
```

## Utilizzo delle Factory Functions

### Server-side (Firebase Functions)

```javascript
const { createDocumento, createLegge, createLeggeMetadata } = require("../schemas/entityFactory");

// Creare un documento per una legge
const documentoData = createDocumento({
  nome: `${titolo}.txt`,
  tipo: 'text/plain',
  storagePath: fileName,
  entityType: 'leggi',
  entityId: leggeId,
  createdBy: null,
  createdByEmail: 'system@normattiva',
  metadata: createLeggeMetadata({
    codiceRedazionale: codiceRedazionale,
    fonte: 'Normattiva',
    dimensione: testoCompleto.length
  })
});

// Creare i metadati della legge
const leggeData = createLegge({
  codiceRedazionale: codiceRedazionale,
  dataGU: dataGU,
  numeroAtto: numeroAtto,
  titolo: titoloAtto,
  storageFilePath: storageFilePath,
  stato: "scaricato"
});
```

### Client-side (Web App)

```javascript
import { createDocumento, createDocumentoMetadata } from './schemas/entityFactory.js';

// Creare un documento caricato dall'utente
const documentoData = createDocumento({
  nome: file.name,
  tipo: file.type,
  storagePath: storagePath,
  entityType: 'altro',
  entityId: null,
  createdBy: currentUser.uid,
  createdByEmail: currentUser.email,
  metadata: createDocumentoMetadata({
    fonte: 'Upload Manuale',
    dimensione: file.size,
    tags: ['contratto', 'importante'],
    titolo: 'Contratto di locazione',
    descrizione: 'Contratto per l\'immobile di via Roma',
    tipologia: 'Contratto',
    stato: true
  })
});
```

## Vantaggi di questa struttura

1. **Consistenza**: Tutti i documenti seguono la stessa struttura base
2. **Flessibilità**: I campi specifici vanno in `metadata` senza rompere la struttura
3. **Compatibilità**: Documenti vecchi e nuovi possono coesistere (backward compatibility)
4. **Manutenibilità**: Modifiche agli schemi centralizzate nelle factory
5. **Type Safety**: Gli schemi JSON possono essere usati per validazione

## Migrazione Dati Esistenti

I documenti esistenti con la vecchia struttura sono compatibili grazie al fallback nella visualizzazione:

```javascript
// Nella tabella, supporta sia vecchia che nuova struttura
e.metadata?.titolo || e.titolo || e.nome || 'N/D'
```

Questo permette una migrazione graduale senza downtime.
