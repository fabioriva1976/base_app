# Entity Factory Synchronization

## Problema Risolto

Per evitare duplicazione e inconsistenze, le factory delle entita hanno **una sola fonte di verita**.

## Architettura

```
shared/schemas/entityFactory.js  ← UNICA FONTE (ES6)
           ↓
    scripts/sync-entity-factories.cjs
           ↓
functions/schemas/entityFactory.js    ← AUTO-GENERATO (CommonJS)
```

## File Coinvolti

1. **Sorgente:** `shared/schemas/entityFactory.js`
   - Modifica solo questo file
   - ES6 modules

2. **Target:** `functions/schemas/entityFactory.js`
   - Auto-generato
   - Non modificare

3. **Script di sync:** `scripts/sync-entity-factories.cjs`

4. **Re-export frontend:** `src/scripts/schemas/entityFactory.js`

## Come Usare

1. Modifica le factory in `shared/schemas/entityFactory.js`
2. Esegui `npm run sync-factories`
3. Verifica frontend e backend

## Funzioni Attive (attuali)

- `createAttachment(params)`
- `createAttachmentMetadata(params)`
- `createCliente(params)`
- `createUtente(params)`
- `createComment(params)`

## Best Practices

- Non creare oggetti a mano: usa sempre le factory
- Se aggiungi una factory nuova, aggiungi test
- Rilancia `sync-factories` prima di test/build
