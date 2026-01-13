# 📌 OTTIMIZZAZIONI - STATO ATTUALE

**Data aggiornamento**: 2026-01-13  
**Scope**: solo elementi mancanti, con situazione attuale e soluzione.

---

## 1) Error tracking in produzione

**Situazione attuale**: non esiste un sistema di error tracking attivo (Functions/SSR/UI).  
**Soluzione**: integrare Sentry o Firebase Crashlytics, inizializzarlo in `functions/config.ts` e catturare le eccezioni nelle Cloud Functions.

---

## 2) Rate limiting sulle API

**Situazione attuale**: nessun rate limit esplicito sulle Callable Functions.  
**Soluzione**: aggiungere un rate limiter per utente/IP (es. `rate-limiter-flexible`) in `functions/utils` e applicarlo nelle API.

---

## 3) CI/CD automatico

**Situazione attuale**: test e deploy sono manuali.  
**Soluzione**: pipeline CI/CD (GitHub Actions) con `npm ci`, test, build e deploy su Firebase.

---

## 4) Content Security Policy (CSP)

**Situazione attuale**: nessun header CSP impostato dal middleware.  
**Soluzione**: aggiungere `Content-Security-Policy` in `src/middleware/index.ts` (solo in produzione).

---

## 5) Bundle optimization

**Situazione attuale**: build senza chunking mirato.  
**Soluzione**: configurare `manualChunks` in `astro.config.mjs` per separare `firebase`/`vendor`.

---

## 6) Visual regression testing

**Situazione attuale**: nessun test visivo automatizzato.  
**Soluzione**: integrare Percy o Chromatic e collegarlo alla pipeline CI.
