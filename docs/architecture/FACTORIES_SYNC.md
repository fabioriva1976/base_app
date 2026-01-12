# Entity Factory Synchronization

## Problema Risolto

Per evitare duplicazione e inconsistenze, le factory delle entita hanno **una sola fonte di verita**.

## Architettura

```
shared/schemas/entityFactory.ts  ← UNICA FONTE (ESM)
           ↓
    scripts/sync-entity-factories.ts
           ↓
functions/schemas/entityFactory.ts    ← AUTO-GENERATO (ESM)
```

## File Coinvolti

1. **Sorgente:** `shared/schemas/entityFactory.ts`
   - Modifica solo questo file
   - ES modules

2. **Target:** `functions/schemas/entityFactory.ts`
   - Auto-generato
   - Non modificare

3. **Script di sync:** `scripts/sync-entity-factories.ts`

4. **Re-export frontend:** `src/scripts/schemas/entityFactory.ts`

## Come Usare

1. Modifica le factory in `shared/schemas/entityFactory.ts`
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
