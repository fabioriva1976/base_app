# 🚀 Applicazione Base per Progetti Firebase

App Astro SSR + Firebase (Functions, Firestore, Auth, Storage) con gestione utenti.

**Template AI-Ready:** Questo progetto è strutturato per essere facilmente estendibile da AI.
Vedi [docs/architecture/AI_START.md](docs/architecture/AI_START.md) per iniziare e
[docs/architecture/PATTERNS.md](docs/architecture/PATTERNS.md) per i pattern standard da replicare.

## 📚 Documentazione

- [docs/architecture/AI_START.md](docs/architecture/AI_START.md) - Guida rapida per sviluppo AI-first
- [docs/architecture/PATTERNS.md](docs/architecture/PATTERNS.md) - Pattern CRUD per creare nuove entità
- [docs/architecture/](docs/architecture/) - Documentazione tecnica dell'architettura
  - [FACTORIES_SYNC.md](docs/architecture/FACTORIES_SYNC.md) - Sistema di sincronizzazione factory frontend/backend
  - [CACHE_SYSTEM.md](docs/architecture/CACHE_SYSTEM.md) - Cache legacy (fallback)
  - [SERVER_SIDE_VALIDATION.md](docs/architecture/SERVER_SIDE_VALIDATION.md) - Validazione server-side per sicurezza
  - [FORMATTERS_CONSOLIDATION.md](docs/architecture/FORMATTERS_CONSOLIDATION.md) - Utility di formattazione centralizzate

## Come avviare 
Prerequisiti: Docker + docker-compose. Tutto parte nel container `firebase-cli` (emulatori + Astro).

1) Build immagine (prima volta o dopo modifiche a package.json):  
   `docker compose build firebase-cli`
2) Start ambiente dev (auto: install già nell’immagine, emulatori, Astro, import db):  
   `docker compose up firebase-cli`
3) Apri: app http://localhost:3000 — Emulator UI http://localhost:4000
4) Log live:
   `docker compose logs -f firebase-cli`
5) Stop senza dump del DB: 
   `docker compose down`
6) Stop con dump del DB: 
   `./stop-and-export.sh`

Se ti serve una shell (es. per comandi firebase manuali):  
`docker compose exec -it firebase-cli sh`

## 🔧 Configurazione Firebase (centralizzata)

- Config client/server in `.env` (parti da `.env.example`).
- Progetti Firebase in `.firebaserc` con alias; usa `firebase use <alias>` prima del deploy.
- Per cambiare progetto: aggiorna solo `.env` e l'alias in `.firebaserc`.

## 🧩 Comandi TypeScript (quando usarli)

- `npm run build:scripts`  
  Compila gli script TS in `scripts/` (generatori e sync).  
  Usalo quando devi eseguire `sync-factories` o `generate:entity`.
- `npm run sync-factories`  
  Copia `shared/schemas/entityFactory.ts` in `functions/schemas/entityFactory.ts`.  
  Usalo dopo ogni modifica alla factory, prima di build/deploy.
- `npm run generate:entity <entita_plural> <EntityName>`  
  Genera i file template per una nuova entita.  
  Usalo quando crei una nuova entita.
- `npm --prefix shared run build`  
  Compila il pacchetto `shared` in JS/d.ts.  
  Usalo prima di deploy o quando vuoi verificare la compilazione.
- `npm --prefix functions run build`  
  Compila le Cloud Functions TS in JS.  
  Usalo prima di `firebase deploy`.


## 🧪 Testing

### Test API (Backend)
# Tutti i test
`docker exec firebase_base_app npm test`

# Solo test unitari
`docker exec firebase_base_app npm run test:unit`

### Test UX (Frontend)
# Test Cypress headless
`docker exec cypress_ui npm run test:e2e`

# Test unitari Cypress headless
`docker exec cypress_ui npx cypress run --spec "cypress/e2e/anagrafica-clienti-create.cy.js"`

# Test Cypress UI (VNC)
Accedi a: http://localhost:7900/vnc.html


### Coverage
# Test Coverage
`docker exec firebase_base_app npm run test:coverage`

# per vedere il report
`xdg-open coverage/lcov-report/index.html`


## Sincronizzare Indici Firestore in Locale
Per scaricare gli indici composti da produzione e usarli con l'emulatore:
1. Entra nel container: 
   `docker compose exec -it firebase-cli sh`
2. Esegui: 
   `firebase firestore:indexes > firestore.indexes.json`


## Test Funzioni Schedulate (Cron) in Locale
Le funzioni cron non partono automaticamente nell'emulatore. Per testarle:
1) Entra nel container: 
   `docker compose exec -it firebase-cli sh`
2) Entra nella shell:  
   `firebase functions:shell`
3) Al prompt "firebase >" digita il nome della fuzione. Esempio: 
   `scaricaLeggiNormattiva()`




## Lanciare npm install
docker compose run --rm firebase-cli npm install



## Deploy su Firebase
Devi essere autenticato con Firebase CLI (puoi farlo anche nel container con `firebase login`).

- Deploy completo (Hosting + astroSSR + funzioni API):  
  `docker compose exec firebase-cli npm run deploy:hosting`
- Solo funzioni:  
  `docker compose exec firebase-cli firebase deploy --only functions`
- Solo hosting + astroSSR:  
  `docker compose exec firebase-cli firebase deploy --only hosting,functions:astroSSR`

- **Regole di Sicurezza**: se modifichi i file `firestore.rules` o `storage.rules`, esegui il deploy specifico:
  `docker compose exec firebase-cli firebase deploy --only firestore:rules,storage:rules`

## Log produzione di function
`docker compose exec firebase-cli firebase functions:log --only astroSSR`


## 📐 Aggiungere Nuove Entità

Questo progetto segue pattern standardizzati per facilitare l'aggiunta di nuove entità.

**Per creare una nuova entita (es: "prodotti"):**

1. Leggi [PATTERNS.md](docs/architecture/PATTERNS.md) - Guida completa ai pattern
2. Aggiungi factory in `shared/schemas/entityFactory.ts`
3. Crea API in `functions/api/prodotti.ts` (usa `functions/api/clienti.ts` come template)
4. Crea test in `tests/functions/prodotti.test.js` (usa `tests/functions/clienti.test.js` come template)
5. Aggiungi store realtime in `src/stores/prodottiStore.ts`
6. Esegui `npm test` per verificare

**File di riferimento:**
- 📄 Template API: `functions/api/clienti.ts` (commentato per AI)
- 🏗️ Factory: `shared/schemas/entityFactory.ts`
- 🧪 Test: `tests/functions/clienti.test.js`
