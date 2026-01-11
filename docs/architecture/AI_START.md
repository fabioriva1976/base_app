# AI Start Here

Questa guida e pensata per estendere il progetto con AI in modo coerente,
senza introdurre regressioni o duplicazioni di pattern.

## Quick Checklist (prima di iniziare)
- Leggi `docs/architecture/PATTERNS.md` per i pattern CRUD.
- Leggi `docs/architecture/PATTERNS-CONFIG.md` per nuove pagine di configurazione.
- Leggi `docs/architecture/SERVER_SIDE_VALIDATION.md` per la sicurezza.
- Leggi `docs/architecture/FACTORIES_SYNC.md` per le factory condivise.
- Se tocchi UI, usa `docs/architecture/FORMATTERS_CONSOLIDATION.md`.
- Se serve realtime, usa `docs/architecture/REALTIME_STORES.md`.

## Source of Truth
- Schema entita: `shared/schemas/entityFactory.js`
- API backend: `functions/api/*.js`
- Regole Firestore: `firestore.rules`
- Regole Storage: `storage.rules`
- UI pagine: `src/pages/*.astro`
- Logica UI: `src/scripts/*.js`
- Test backend: `tests/functions/*.test.js`

## Regole di base (AI-first)
- Non modificare file generati: `functions/schemas/entityFactory.js` (generato da sync).
- Ogni nuova entita deve avere: factory, API CRUD, test, pagina Astro, script UI, regole Firestore.
- Naming: collection snake_case, API camelCase, file plurali per API/test.
- Usa sempre le factory per creare oggetti (non creare oggetti a mano).
- Validazione doppia: client + server. La logica di autorizzazione deve stare in Functions.

## Percorso consigliato per nuove entita
1. Aggiungi factory in `shared/schemas/entityFactory.js`
2. Esegui `npm run sync-factories`
3. Crea API in `functions/api/[entita].js` (copia `functions/api/clienti.js`)
4. Aggiungi test in `tests/functions/[entita].test.js`
5. Aggiungi pagina `src/pages/[entita].astro`
6. Aggiungi script `src/scripts/[entita].js`
7. Aggiorna `firestore.rules` se serve

## Pattern riutilizzabili
- CRUD standard: `functions/api/clienti.js`
- Template CRUD standard: `functions/api/_template-entity.js`
- User management (Auth + Firestore): `functions/api/users.js`
- Attachments (Firestore + Storage): `functions/api/attachments.js`
- Comments: `functions/api/comments.js`

## Template pack (AI)
Usa i file in `templates/` come base per nuove entita:
- `templates/entity.api.template.js`
- `templates/entity.test.template.js`
- `templates/entity.page.template.astro`
- `templates/entity.script.template.js`
- `templates/entity.store.template.js`

Generazione automatica:
`npm run generate:entity <entita_plural> <EntityName>`

## Cosa evitare
- Duplicare logiche di formattazione: usa `src/scripts/utils/formatters.js`
- Aggirare i pattern di audit log: usa `functions/utils/auditLogger.js`
- Scritture client dirette su collection protette (usare Cloud Functions)
