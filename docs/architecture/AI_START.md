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
- Per caching dati lista, usa realtime + persistence (evita cache custom).

## Source of Truth
- Schema entita: `shared/schemas/entityFactory.ts`
- API backend: `functions/api/*.ts`
- Regole Firestore: `firestore.rules`
- Regole Storage: `storage.rules`
- UI pagine: `src/pages/*.astro`
- Logica UI: `src/scripts/*.ts`
- Test backend: `tests/functions/*.test.js`

## Regole di base (AI-first)
- Non modificare file generati: `functions/schemas/entityFactory.ts` (generato da sync).
- Nei file TypeScript, usa `.ts` negli import locali (tsc riscrive in `.js` in output Node).
- Ogni nuova entita deve avere: factory, API CRUD, test, pagina Astro, script UI, regole Firestore.
- Naming: collection snake_case, API camelCase, file plurali per API/test.
- Usa sempre le factory per creare oggetti (non creare oggetti a mano).
- Validazione doppia: client + server. La logica di autorizzazione deve stare in Functions.
- Evita cache manuale: usa store realtime + Firestore persistence.

## Percorso consigliato per nuove entita
1. Aggiungi factory in `shared/schemas/entityFactory.ts`
2. Esegui `npm run sync-factories`
3. Crea API in `functions/api/[entita].ts` (copia `functions/api/clienti.ts`)
4. Aggiungi test in `tests/functions/[entita].test.js`
5. Aggiungi pagina `src/pages/[entita].astro`
6. Aggiungi script `src/scripts/[entita].ts`
7. Aggiungi store realtime `src/stores/[entita]Store.ts`
8. Aggiorna `firestore.rules` se serve

## Pattern riutilizzabili
- CRUD standard: `functions/api/clienti.ts`
- Template CRUD standard: `functions/api/_template-entity.ts`
- User management (Auth + Firestore): `functions/api/users.ts`
- Attachments (Firestore + Storage): `functions/api/attachments.ts`
- Comments: `functions/api/comments.ts`

## Template pack (AI)
Usa i file in `templates/` come base per nuove entita:
- `templates/entity.api.template.ts`
- `templates/entity.test.template.ts`
- `templates/entity.page.template.astro`
- `templates/entity.script.template.ts`
- `templates/entity.store.template.ts`

Generazione automatica:
`npm run generate:entity <entita_plural> <EntityName>`

## Caching (linea guida)
- Il default e: store realtime + persistence Firestore (offline/cache locale).
- Usa `firestoreCache.ts` solo per casi legacy o se non puoi usare realtime.

## Attachments (Documenti)
- Backend: `functions/api/attachments.ts` (`createAttachmentRecordApi`, `updateAttachmentApi`, `deleteAttachmentApi`)
- Dati: Firestore `attachments` + file in Storage.
- Frontend: `src/scripts/utils/attachmentUtils.ts`
- Setup: `attachmentUtils.setup({ db, storage, auth, functions, entityCollection })`
- Realtime: `attachmentUtils.listenForAttachments(entityId)`
- UI richiesti: `#file-drop-area`, `#document-upload`, `#document-preview-list`

## Comments (Note)
- Backend: `functions/api/comments.ts` (`createCommentApi`, `getEntityCommentsApi`, `deleteCommentApi`)
- Dati: Firestore `comments`
- Frontend: `src/scripts/utils/commentUtils.ts`
- Setup: `commentUtils.setup({ db, auth, functions, entityCollection })`
- Realtime: `commentUtils.listenForComments(entityId)`
- UI richiesti: `#comment-text`, `#save-comment-btn`, `#comment-list`

## Cosa evitare
- Duplicare logiche di formattazione: usa `src/scripts/utils/formatters.ts`
- Aggirare i pattern di audit log: usa `functions/utils/auditLogger.ts`
- Scritture client dirette su collection protette (usare Cloud Functions)
