# Applicazione base per progetti Firebase
App Astro SSR + Firebase (Functions, Firestore, Auth, Storage) con gestione utenti.

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



## Log produzione di function
`docker compose exec firebase-cli firebase functions:log --only astroSSR`





