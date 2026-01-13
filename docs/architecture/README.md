# Documentazione Architettura

Questa directory contiene la documentazione tecnica dell'architettura e dei pattern implementati nel progetto.

## Documenti Disponibili

### [AI_START.md](AI_START.md)
Guida rapida AI-first con checklist e percorsi di riferimento.

**Quando usare:** Prima di aggiungere una nuova entita o modificare pattern esistenti.

**Key Points:**
- Checklist operativa per AI
- Percorsi e file "source of truth"
- Niente modifiche a file generati

### [REALTIME_STORES.md](REALTIME_STORES.md)
Pattern per aggiornamenti realtime UI con nanostores + Firebase snapshots.

**Quando usare:** Quando vuoi che tabelle/form si aggiornino automaticamente quando i dati cambiano su Firestore.

**Key Points:**
- State management: nanostores (<1KB)
- Realtime: Firebase `onSnapshot()`
- Auto-update: UI si aggiorna quando Firestore cambia
- Meno codice: Elimina `loadEntities()`, polling, manual refresh

---

### [FACTORIES_SYNC.md](FACTORIES_SYNC.md)
Sistema di sincronizzazione delle factory functions tra frontend e backend (ESM).

**Quando usare:** Quando devi modificare o creare nuove factory functions per entita.

**Key Points:**
- File sorgente unico: `shared/schemas/entityFactory.ts`
- Script di sync automatico: `npm run sync-factories`
- Target auto-generato: `functions/schemas/entityFactory.ts`

---

### [CACHE_SYSTEM.md](CACHE_SYSTEM.md)
Cache legacy in-memory per Firestore. Il default attuale e realtime store + persistence Firestore.

**Quando usare:** Solo se non puoi usare realtime/persistence (casi legacy o query one-shot).

**Key Points:**
- Default: realtime store + persistence Firestore
- Legacy: `src/scripts/utils/firestoreCache.ts`
- Funzioni: `getCached()`, `invalidateCache()`

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
- File unico: `src/scripts/utils/formatters.ts`
- Funzioni: `formatDate()`, `formatFileSize()`, `formatTags()`, etc.
- Evita duplicazione codice

---

### Template API CRUD
Template pronto per nuove entita (stile clienti): `functions/api/_template-entity.ts`

### Template pack AI
Set completo di template (API, test, pagina, script, store): `templates/`

## Pattern di Lettura Consigliato

### Per Sviluppatori Nuovi al Progetto
1. Leggi [PATTERNS.md](PATTERNS.md) prima di tutto
2. Poi leggi questi documenti nell'ordine:
   - REALTIME_STORES.md (come aggiornare UI in tempo reale)
   - FACTORIES_SYNC.md (come funzionano i dati)
   - SERVER_SIDE_VALIDATION.md (come validare)
   - FORMATTERS_CONSOLIDATION.md (come presentare i dati)
   - CACHE_SYSTEM.md (solo legacy)

### Per AI che Estendono il Progetto
1. Leggi [AI_START.md](AI_START.md)
2. Leggi [PATTERNS.md](PATTERNS.md) per i pattern CRUD
2. Consulta REALTIME_STORES.md per state management realtime
3. Consulta SERVER_SIDE_VALIDATION.md per la sicurezza
4. Consulta FACTORIES_SYNC.md per la struttura dati
5. Usa FORMATTERS_CONSOLIDATION.md per la UI

### Per Manutenzione
- **Aggiungere realtime updates:** REALTIME_STORES.md
- **Modificare struttura entita:** FACTORIES_SYNC.md
- **Aggiungere validazione:** SERVER_SIDE_VALIDATION.md
- **Ottimizzare performance:** REALTIME_STORES.md (default) / CACHE_SYSTEM.md (legacy)
- **Standardizzare UI:** FORMATTERS_CONSOLIDATION.md

---

## Note

Questi documenti descrivono pattern già implementati nel progetto.
Per creare nuove entita seguendo questi pattern, consulta [PATTERNS.md](PATTERNS.md).
