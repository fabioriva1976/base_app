# 🚀 Applicazione Base per Progetti Firebase

App Astro SSR + Firebase (Functions, Firestore, Auth, Storage) con gestione utenti.

**Template AI-Ready:** Questo progetto è strutturato per essere facilmente estendibile da AI.
Vedi [PATTERNS.md](PATTERNS.md) per i pattern standard da replicare.

## 📚 Documentazione

- [PATTERNS.md](PATTERNS.md) - Pattern CRUD per creare nuove entità
- [docs/architecture/](docs/architecture/) - Documentazione tecnica dell'architettura
  - [FACTORIES_SYNC.md](docs/architecture/FACTORIES_SYNC.md) - Sistema di sincronizzazione factory frontend/backend
  - [CACHE_SYSTEM.md](docs/architecture/CACHE_SYSTEM.md) - Sistema di cache Firestore in-memory
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

**Per creare una nuova entità (es: "prodotti"):**

1. Leggi [PATTERNS.md](PATTERNS.md) - Guida completa ai pattern
2. Aggiungi factory in `shared/schemas/entityFactory.js`
3. Crea API in `functions/api/prodotti.js` (usa `functions/api/clienti.js` come template)
4. Crea test in `functions/prodotti.test.js` (usa `functions/clienti.test.js` come template)
5. Esegui `npm test` per verificare

**File di riferimento:**
- 📄 Template API: `functions/api/clienti.js` (commentato per AI)
- 🏗️ Factory: `shared/schemas/entityFactory.js`
- 🧪 Test: `functions/clienti.test.js`
