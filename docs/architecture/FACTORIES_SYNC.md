# Entity Factory Synchronization

## Problema Risolto

Prima avevamo **due file duplicati** con lo stesso codice di factory functions:
- `/shared/schemas/entityFactory.js` (sorgente unica - ES6 modules)
- `/functions/schemas/entityFactory.js` (backend - CommonJS)

Questo causava:
- ❌ Duplicazione del codice (DRY violation)
- ❌ Rischio di inconsistenza tra frontend e backend
- ❌ Doppio lavoro per manutenzione
- ❌ Bug difficili da tracciare

## Soluzione Implementata

### Architettura

```
shared/schemas/entityFactory.js  ← UNICA FONTE DI VERITÀ (ES6)
           ↓
    [sync script]
           ↓
functions/schemas/entityFactory.js    ← AUTO-GENERATO (CommonJS)
```

### File Coinvolti

1. **Sorgente**: [/shared/schemas/entityFactory.js](../shared/schemas/entityFactory.js)
   - File principale con la logica
   - Usa ES6 modules (`export function`)
   - Modifiche vanno fatte QUI

   Nota frontend: `src/scripts/schemas/entityFactory.js` re-esporta da `@shared/schemas/entityFactory.js`.

2. **Target**: [/functions/schemas/entityFactory.js](../functions/schemas/entityFactory.js)
   - **AUTO-GENERATO** - Non modificare direttamente!
   - Usa CommonJS (`module.exports`)
   - Generato automaticamente dallo script di sync

3. **Script di Sync**: [/scripts/sync-entity-factories.cjs](../scripts/sync-entity-factories.cjs)
   - Legge il file ES6 del frontend
   - Converte `export` in `module.exports`
   - Genera il file CommonJS per le Cloud Functions

## Come Usare

### Sviluppo Normale

Quando modifichi le factory functions:

1. **Modifica SOLO** il file frontend:
   ```bash
   # Apri e modifica
   vim shared/schemas/entityFactory.js
   ```

2. **Sincronizza** con il backend:
   ```bash
   npm run sync-factories
   ```

3. **Verifica** che funzioni:
   ```bash
   # Testa frontend
   npm run dev

   # Testa backend
   cd functions && npm test
   ```

### Build & Deploy

Lo script di sync è **automaticamente integrato** nel build:

```bash
# Build automaticamente esegue sync
npm run build

# Deploy include il sync
npm run deploy
```

Nel `package.json`:
```json
{
  "scripts": {
    "build": "npm run sync-factories && astro build && ...",
    "sync-factories": "node scripts/sync-entity-factories.cjs"
  }
}
```

## Funzioni Disponibili

Tutte le funzioni sono disponibili sia nel frontend che nel backend:

### `createDocumento(params)`
Crea un documento con struttura standard.

**Parametri:**
- `titolo` (string) - Titolo del documento
- `tipo` (string) - MIME type
- `storagePath` (string) - Percorso in Storage
- `entityType` (string, optional) - Tipo entità collegata
- `entityId` (string, optional) - ID entità collegata
- `createdBy` (string, optional) - UID utente creatore
- `createdByEmail` (string, optional) - Email utente creatore
- `metadata` (object, optional) - Metadati aggiuntivi

**Esempio:**
```javascript
// Frontend
import { createDocumento } from './schemas/entityFactory.js';
const doc = createDocumento({ titolo: 'File.pdf', tipo: 'application/pdf', ... });

// Backend
  const { createDocumento } = require('./schemas/entityFactory');
const doc = createDocumento({ titolo: 'File.pdf', tipo: 'application/pdf', ... });
```

### Funzioni attive
- `createDocumento(params)`
- `createDocumentoMetadata(params)`

### `createDocumentoMetadata(params)`
Crea metadati per documento generico.

## Troubleshooting

### Lo script di sync non funziona

```bash
# Verifica che lo script esista
ls -la scripts/sync-entity-factories.cjs

# Esegui manualmente per vedere errori
node scripts/sync-entity-factories.cjs
```

### Le modifiche non si riflettono nel backend

```bash
# Re-sincronizza manualmente
npm run sync-factories

# Verifica che il file target sia aggiornato
cat functions/schemas/entityFactory.js | head -20
```

### Errore "require is not defined"

Lo script deve essere `.cjs` (non `.js`) perché il progetto usa `"type": "module"`.

## Best Practices

### ✅ DO

- Modifica SOLO il file sorgente in `shared/schemas/`
- Esegui `npm run sync-factories` dopo ogni modifica
- Testa sia frontend che backend dopo sync
- Aggiungi test per le nuove factory functions

### ❌ DON'T

- NON modificare direttamente `functions/schemas/entityFactory.js`
- NON fare commit del file backend senza rieseguire il sync
- NON aggiungere logica diversa tra frontend e backend

## Vantaggi della Soluzione

✅ **Unica Fonte di Verità**: Solo un file da mantenere
✅ **Sync Automatico**: Integrato nel build process
✅ **No Errori Manuali**: Conversione ES6→CommonJS automatica
✅ **Backward Compatible**: Tutto il codice esistente continua a funzionare
✅ **Facile Debugging**: Header chiaro nel file auto-generato

## Prossimi Passi (Opzionale)

Per migliorare ulteriormente:

1. **Aggiungere Tests**: Crea test che verificano che frontend e backend generino gli stessi oggetti
2. **Pre-commit Hook**: Esegui sync automaticamente prima del commit
3. **CI/CD Check**: Verifica nel CI che i file siano sincronizzati
4. **TypeScript**: Aggiungi type definitions condivise

## File Modificati

- ✅ `/shared/schemas/entityFactory.js` - Fonte principale
- ✅ `/functions/schemas/entityFactory.js` - Auto-generato con header
- ✅ `/scripts/sync-entity-factories.cjs` - Script di sincronizzazione
- ✅ `/package.json` - Aggiunto script `sync-factories`
- ✅ `/docs/architecture/FACTORIES_SYNC.md` - Questa documentazione
