# Schemi Dati - Legal Assistant

Questa directory contiene gli schemi JSON e le factory functions per garantire la consistenza delle strutture dati in tutto il progetto.

## Struttura Standard

### Collezione `documenti`

Tutti i documenti (sia caricati manualmente che scaricati automaticamente) seguono questa struttura:

```json
{
  "nome": "string - Nome del file (es: 'Contratto.pdf')",
  "tipo": "string - MIME type (es: 'application/pdf', 'text/plain')",
  "storagePath": "string - Percorso in Firebase Storage (es: 'documenti/file.pdf')",
  "entityType": "string - Tipo entità collegata ('clienti', 'utenti', 'altro')",
  "entityId": "string|null - ID dell'entità collegata",
  "createdAt": "string - Data creazione ISO 8601",
  "updatedAt": "string - Data ultimo aggiornamento ISO 8601",
  "createdBy": "string|null - UID utente creatore",
  "createdByEmail": "string|null - Email utente creatore",
  "metadata": {
    "fonte": "string - Fonte del documento (es: 'Upload Manuale')",
    "dimensione": "number - Dimensione file in bytes",
    "tags": "array - Tag per categorizzazione",
    "titolo": "string - Titolo del documento",
    "descrizione": "string - Descrizione del documento",
    "tipologia": "string - Tipologia del documento",
    "stato": "boolean - Stato attivo/inattivo"
  }
}
```

## Utilizzo delle Factory Functions

### Server-side (Firebase Functions)

```javascript
const { createDocumento, createDocumentoMetadata } = require("../schemas/entityFactory");
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
