# Documentazione Architettura

Questa directory contiene la documentazione tecnica dell'architettura e dei pattern implementati nel progetto.

## Documenti Disponibili

### [FACTORIES_SYNC.md](FACTORIES_SYNC.md)
Sistema di sincronizzazione delle factory functions tra frontend (ES6 modules) e backend (CommonJS).

**Quando usare:** Quando devi modificare o creare nuove factory functions per entità.

**Key Points:**
- File sorgente unico: `shared/schemas/entityFactory.js`
- Script di sync automatico: `npm run sync-factories`
- Target auto-generato: `functions/schemas/entityFactory.js`

---

### [CACHE_SYSTEM.md](CACHE_SYSTEM.md)
Sistema di cache in-memory per Firestore con TTL e invalidazione automatica.

**Quando usare:** Quando implementi nuove query Firestore che potrebbero beneficiare di caching.

**Key Points:**
- Utility: `src/scripts/utils/firestoreCache.js`
- Funzioni: `getCached()`, `invalidateCache()`
- Risparmio: 70-75% reads Firestore, 95% latency reduction

---

### [SERVER_SIDE_VALIDATION.md](SERVER_SIDE_VALIDATION.md)
Pattern di validazione server-side con Cloud Functions per sicurezza e data integrity.

**Quando usare:** Quando crei nuove API CRUD che richiedono validazione e autorizzazione.

**Key Points:**
- Defense in Depth: Security Rules + Cloud Functions + Client validation
- Anti-XSS sanitization
- Business rules enforcement
- Audit trail automatico

---

### [FORMATTERS_CONSOLIDATION.md](FORMATTERS_CONSOLIDATION.md)
Utility functions centralizzate per formattazione dati (date, file size, tags, etc.).

**Quando usare:** Quando devi formattare dati per la UI in modo consistente.

**Key Points:**
- File unico: `src/scripts/utils/formatters.js`
- Funzioni: `formatDate()`, `formatFileSize()`, `formatTags()`, etc.
- Evita duplicazione codice

---

## Pattern di Lettura Consigliato

### Per Sviluppatori Nuovi al Progetto
1. Leggi [/PATTERNS.md](../../PATTERNS.md) prima di tutto
2. Poi leggi questi documenti nell'ordine:
   - FACTORIES_SYNC.md (come funzionano i dati)
   - SERVER_SIDE_VALIDATION.md (come validare)
   - FORMATTERS_CONSOLIDATION.md (come presentare i dati)
   - CACHE_SYSTEM.md (come ottimizzare)

### Per AI che Estendono il Progetto
1. Leggi [/PATTERNS.md](../../PATTERNS.md) per i pattern CRUD
2. Consulta SERVER_SIDE_VALIDATION.md per la sicurezza
3. Consulta FACTORIES_SYNC.md per la struttura dati
4. Usa FORMATTERS_CONSOLIDATION.md per la UI

### Per Manutenzione
- **Modificare struttura entità:** FACTORIES_SYNC.md
- **Aggiungere validazione:** SERVER_SIDE_VALIDATION.md
- **Ottimizzare performance:** CACHE_SYSTEM.md
- **Standardizzare UI:** FORMATTERS_CONSOLIDATION.md

---

## Note

Questi documenti descrivono pattern già implementati nel progetto.
Per creare nuove entità seguendo questi pattern, consulta [/PATTERNS.md](../../PATTERNS.md).
