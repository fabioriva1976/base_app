# AI Legal Assistant
App Astro SSR + Firebase (Functions, Firestore, Auth, Storage) con chat RAG.

## Come avviare (solo Docker)
Prerequisiti: Docker + docker-compose. Tutto parte nel container `firebase-cli` (emulatori + Astro).

1) Build immagine (prima volta o dopo modifiche a package.json):  
   `docker compose build firebase-cli`
2) Start ambiente dev (auto: install già nell’immagine, emulatori, Astro):  
   `docker compose up firebase-cli`
3) Apri: app http://localhost:3000 — Emulator UI http://localhost:4000
4) Log live: `docker compose logs -f firebase-cli`
5) Stop: `docker compose down`

Non serve entrare nel container per lo sviluppo standard. Se ti serve una shell (es. per comandi firebase manuali):  
`docker compose exec -it firebase-cli sh`

## Deploy su Firebase
.firebaserc usa il progetto `legal-816fa`. Devi essere autenticato con Firebase CLI (puoi farlo anche nel container con `firebase login`).

- Deploy completo (Hosting + astroSSR + funzioni API):  
  `docker compose exec firebase-cli npm run deploy:hosting`
- Solo funzioni:  
  `docker compose exec firebase-cli firebase deploy --only functions`
- Solo hosting + astroSSR:  
  `docker compose exec firebase-cli firebase deploy --only hosting,functions:astroSSR`

Note:
- **Emulatori**: porte configurate in `firebase.json` (UI 4000, Firestore 8080, Functions 5001, Auth 9099, Storage 9299).
- **Configurazioni AI/SMTP**: gestite tramite UI web (Profilo > Agenti AI / SMTP).
- **Regole di Sicurezza**: se modifichi i file `firestore.rules` o `storage.rules`, esegui il deploy specifico:
  `docker compose exec firebase-cli firebase deploy --only firestore:rules,storage:rules`

## Sincronizzare Indici Firestore in Locale
Per scaricare gli indici composti da produzione e usarli con l'emulatore:
1. Entra nel container: `docker compose exec -it firebase-cli sh`
2. Esegui: `firebase firestore:indexes > firestore.indexes.json`
3. Riavvia gli emulatori (`docker compose down && docker compose up firebase-cli`). L'emulatore di Firestore caricherà automaticamente il file `firestore.indexes.json`.

## Test Funzioni Schedulate (Cron) in Locale
Le funzioni cron non partono automaticamente nell'emulatore. Per testarle, avvia l'ambiente (`docker compose up firebase-cli`), entra nel container (`docker compose exec -it firebase-cli sh`) e usa la shell delle funzioni:

1. `firebase functions:shell`
2. Al prompt `firebase >`, lancia la funzione per nome. Esempio: `scaricaLeggiNormattiva()`



## Log produzione di function

docker compose exec firebase-cli firebase functions:log --only astroSSR



## Comandi da usare:

Prima volta/dopo modifiche a package.json: 
`docker compose build firebase-cli`

Avvio completo (site + emulatori con import/export): 
`docker compose up firebase-cli`

Stop (se non voglio export del db): 
`docker compose down`

Stop (se voglio export del db): 
`./stop-and-export.sh`

