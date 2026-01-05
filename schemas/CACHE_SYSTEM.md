# Sistema di Cache Firestore

## Problema Risolto

Prima ogni volta che un utente navigava o ricaricava una pagina, venivano rifatte le stesse chiamate a Firestore:

- ❌ Costi elevati (ogni `getDocs()` = N read operations)
- ❌ Latency inutile (100-300ms per ogni fetch)
- ❌ UX lenta (caricamenti ripetuti degli stessi dati)

**Esempio senza cache:**
```
User apre /page-pratiche → getDocs('pratiche') = 50 reads
User torna indietro e riapre → getDocs('pratiche') = 50 reads (di nuovo!)
User ricarica pagina → getDocs('pratiche') = 50 reads (di nuovo!)

TOTALE: 150 reads per gli stessi dati
```

## Soluzione Implementata

Sistema di **cache in-memory con invalidazione automatica**:

1. **Cache con TTL**: Dati cachati per un tempo configurabile
2. **Invalidazione automatica**: Cache invalidata dopo create/update/delete
3. **Trasparente**: Stessa API di Firestore, zero refactoring per l'utente

**Con cache:**
```
User apre /page-pratiche → getDocs('pratiche') = 50 reads ⚠️ + cache
User torna indietro e riapre → cache HIT = 0 reads ✅
User ricarica pagina → cache HIT = 0 reads ✅
...dopo 2 minuti...
User ricarica → cache scaduta → getDocs = 50 reads ⚠️ + refresh cache

TOTALE: 50-100 reads invece di 150+ (risparmio 33-66%)
```

## File Coinvolti

### Creato

**[/src/scripts/utils/firestoreCache.js](../src/scripts/utils/firestoreCache.js)** (117 lines)
- `getCached(key, fetchFn, ttl)` - Ottiene dati da cache o fetch
- `invalidateCache(key)` - Invalida una chiave specifica
- `invalidateCachePattern(pattern)` - Invalida per pattern
- `clearCache()` - Pulisce tutta la cache
- `getCacheStats()` - Statistiche di debug

### Aggiornato

**[/src/scripts/page-pratiche.js](../src/scripts/page-pratiche.js)**
- Importa utilities cache
- `loadChats()` usa cache con TTL 2 minuti
- `loadClienti()` usa cache con TTL 30 minuti
- `savePratica()` invalida cache dopo create/update
- `deleteChat()` invalida cache dopo delete

## Come Usare

### 1. Import delle Utilities

```javascript
import { getCached, invalidateCache } from './utils/firestoreCache.js';
```

### 2. Wrappa le Query Firestore

**Prima (senza cache):**
```javascript
async function loadClienti() {
    const clientiRef = collection(db, 'anagrafica_clienti');
    const q = query(clientiRef, orderBy('ragione_sociale', 'asc'));
    const querySnapshot = await getDocs(q);

    // processa querySnapshot...
}
```

**Dopo (con cache):**
```javascript
async function loadClienti() {
    const querySnapshot = await getCached(
        'collection:anagrafica_clienti',  // Chiave cache univoca
        async () => {
            // Funzione fetch originale
            const clientiRef = collection(db, 'anagrafica_clienti');
            const q = query(clientiRef, orderBy('ragione_sociale', 'asc'));
            return await getDocs(q);
        },
        30 * 60 * 1000  // TTL: 30 minuti
    );

    // processa querySnapshot come prima...
}
```

### 3. Invalida Cache Dopo Write Operations

**Create:**
```javascript
async function createCliente(clienteData) {
    // Salva in Firestore
    const docRef = await addDoc(collection(db, 'anagrafica_clienti'), clienteData);

    // Invalida cache
    invalidateCache('collection:anagrafica_clienti');

    // Ricarica lista (userà fetch fresh)
    await loadClienti();
}
```

**Update:**
```javascript
async function updateCliente(clienteId, updates) {
    // Aggiorna in Firestore
    await updateDoc(doc(db, 'anagrafica_clienti', clienteId), updates);

    // Invalida cache
    invalidateCache('collection:anagrafica_clienti');

    // Ricarica
    await loadClienti();
}
```

**Delete:**
```javascript
async function deleteCliente(clienteId) {
    // Elimina da Firestore
    await deleteDoc(doc(db, 'anagrafica_clienti', clienteId));

    // Invalida cache
    invalidateCache('collection:anagrafica_clienti');

    // Ricarica
    await loadClienti();
}
```

## TTL Raccomandati

Scegli il TTL in base alla frequenza di modifica:

| Tipo Dato | Frequenza Modifica | TTL Raccomandato |
|-----------|-------------------|------------------|
| **Anagrafica clienti** | Rara (1-2 volte/giorno) | 30 minuti |
| **Lista utenti** | Molto rara (nuovi utenti) | 60 minuti |
| **Configurazioni** | Rarissima (admin only) | 60 minuti |
| **Pratiche/Task** | Frequente (ogni ora) | 2-5 minuti |
| **Messaggi chat** | Molto frequente | NO CACHE (usa real-time) |
| **Documenti** | Media (giornaliera) | 10 minuti |

## Naming Convention per Chiavi Cache

Usa pattern consistente per facile invalidazione:

```javascript
// Collection semplice
'collection:anagrafica_clienti'

// Collection con filtro utente
'collection:pratiche:user:${userId}'

// Collection con parametri query
'collection:documenti:entityType:pratica:entityId:${praticaId}'

// Documento singolo
'document:pratiche:${praticaId}'

// Query custom
'query:pratiche:aperte:user:${userId}'
```

## Esempi Completi

### Esempio 1: Lista Documenti (TTL 10 min)

```javascript
// page-documenti.js
import { getCached, invalidateCache } from './utils/firestoreCache.js';

async function loadDocumenti(entityType, entityId) {
    const cacheKey = `collection:documenti:${entityType}:${entityId}`;

    const querySnapshot = await getCached(
        cacheKey,
        async () => {
            const q = query(
                collection(db, 'documenti'),
                where('entityType', '==', entityType),
                where('entityId', '==', entityId),
                orderBy('createdAt', 'desc')
            );
            return await getDocs(q);
        },
        10 * 60 * 1000 // 10 minuti
    );

    // Processa documenti...
}

async function uploadDocumento(file, metadata) {
    // Upload e salva...
    await addDoc(collection(db, 'documenti'), docData);

    // Invalida cache
    invalidateCache(`collection:documenti:${metadata.entityType}:${metadata.entityId}`);

    // Ricarica
    await loadDocumenti(metadata.entityType, metadata.entityId);
}
```

### Esempio 2: Autocomplete con Cache

```javascript
// Carica opzioni una volta
let cachedOptions = null;

async function setupAutocomplete() {
    // Usa cache per evitare fetch ripetuti
    const docs = await getCached(
        'collection:options_dropdown',
        async () => await getDocs(collection(db, 'options')),
        60 * 60 * 1000 // 1 ora
    );

    cachedOptions = docs.docs.map(d => ({ id: d.id, label: d.data().name }));
    renderAutocomplete(cachedOptions);
}
```

### Esempio 3: Invalidazione Pattern

```javascript
// Invalida tutte le cache pratiche per tutti gli utenti
invalidateCachePattern(/^collection:pratiche:/);

// Invalida tutte le cache documenti
invalidateCachePattern(/^collection:documenti:/);
```

## Debug e Monitoring

### Console Debug

Apri console browser e usa:

```javascript
// Vedi statistiche cache
window.firestoreCacheStats()

// Output:
// {
//   totalKeys: 3,
//   totalSizeKB: 45.2,
//   keys: [
//     { key: 'collection:pratiche:user:abc123', age: 45, sizeKB: 23.4 },
//     { key: 'collection:anagrafica_clienti', age: 120, sizeKB: 18.7 },
//     { key: 'collection:documenti:pratica:xyz', age: 30, sizeKB: 3.1 }
//   ]
// }

// Pulisci tutta la cache
window.clearFirestoreCache()
```

### Log Console Automatici

Il sistema logga automaticamente:

```
✅ Cache HIT: collection:anagrafica_clienti (età: 45s)
⚠️ Cache MISS: collection:pratiche:user:abc123
🗑️ Cache invalidata: collection:pratiche:user:abc123
```

Questo ti aiuta a:
- Verificare che la cache funzioni
- Identificare cache miss frequenti (TTL troppo breve?)
- Debug problemi di invalidazione

## Performance Impact

### Metriche Attese

**Prima (no cache):**
- Caricamento lista pratiche: 200-400ms
- Ogni reload: 200-400ms
- 10 reload/sessione = 2000-4000ms totali
- Firestore reads: 50 × 10 = 500 reads

**Dopo (con cache):**
- Primo caricamento: 200-400ms (stesso)
- Reload successivi: 5-10ms (cache hit!)
- 10 reload/sessione = 205-410ms totali (95% più veloce!)
- Firestore reads: 50 + (50 ogni 2 min) = ~150 reads (70% risparmio)

### Costi Firestore Risparmiati

Assumendo 100 utenti attivi/giorno:

**Senza cache:**
```
100 users × 20 page loads/day × 50 reads = 100,000 reads/day
Costo: $0.36/day × 30 = $10.80/mese
```

**Con cache (TTL 2 min):**
```
100 users × 5 fetch/day × 50 reads = 25,000 reads/day
Costo: $0.09/day × 30 = $2.70/mese

RISPARMIO: $8.10/mese (75% riduzione)
```

## Troubleshooting

### Cache non si invalida dopo modifica

**Problema:** Modifico un cliente ma vedo ancora dati vecchi.

**Causa:** Probabilmente manca `invalidateCache()` dopo write.

**Soluzione:**
```javascript
// Verifica che dopo ogni write ci sia:
await updateDoc(...);
invalidateCache('collection:anagrafica_clienti'); // ← IMPORTANTE!
await loadClienti();
```

### Cache troppo aggressiva - dati obsoleti

**Problema:** Dati aggiornati da altro utente non visibili.

**Causa:** TTL troppo lungo.

**Soluzione:** Riduci TTL per dati frequentemente modificati:
```javascript
// Invece di 30 minuti
await getCached(key, fetchFn, 30 * 60 * 1000);

// Usa 2-5 minuti
await getCached(key, fetchFn, 2 * 60 * 1000);
```

### Memory leak - cache cresce troppo

**Problema:** Dopo ore di utilizzo, memoria browser alta.

**Causa:** Troppe chiavi cache diverse (es. cache per ogni documento).

**Soluzione:**
1. Evita cache per dati altamente dinamici
2. Usa `clearCache()` periodicamente:
```javascript
// Ogni 30 minuti pulisci cache vecchie
setInterval(() => {
    console.log('Pulizia cache periodica');
    clearCache();
}, 30 * 60 * 1000);
```

### Dati non aggiornati dopo modifica da altro browser

**Questo è normale!** La cache è locale al browser.

**Opzioni:**
1. Accettalo (UX ok, dati fresh entro TTL)
2. Usa Real-Time Listeners invece di cache per dati critici
3. Polling periodico:
```javascript
// Ogni 5 minuti ricarica pratiche
setInterval(() => {
    invalidateCache('collection:pratiche:...');
    loadPratiche();
}, 5 * 60 * 1000);
```

## Best Practices

### ✅ DO

- Usa cache per liste/collection che cambiano raramente
- Invalida cache dopo OGNI write operation
- Usa TTL appropriato per tipo di dato
- Monitora cache stats in development
- Testa scenari multi-utente

### ❌ DON'T

- NON cachare dati altamente dinamici (messaggi chat)
- NON usare TTL eccessivamente lunghi (>1 ora)
- NON dimenticare invalidation dopo write
- NON cachare query con parametri utente-specifici senza includerli nella key
- NON fare cache di dati sensibili (se shared device)

## Prossimi Passi (Opzionale)

1. **LocalStorage Persistence**: Cache persiste tra refresh
2. **Service Worker Cache**: Cache a livello network
3. **Real-Time Invalidation**: Listener cross-tab per invalidare cache di tutti i tab aperti
4. **Metrics Dashboard**: Visualizza hit rate, savings, performance

## Files da Aggiornare

Per applicare il caching ad altri file:

### Alta Priorità
- [ ] `/src/scripts/page-documenti.js` - Cache documenti (TTL 10 min)
- [ ] `/src/scripts/anagrafica-clienti.js` - Invalida dopo modifica clienti

### Media Priorità
- [ ] `/src/scripts/anagrafica-utenti.js` - Cache utenti (TTL 30 min)
- [ ] `/src/scripts/page-pratica.js` - Cache singola pratica (TTL 5 min)

### Bassa Priorità
- [ ] Configurazioni (già caricano raramente)
- [ ] Audit logs (read-only, no cache needed)

---

## Conclusione

Il sistema di cache implementato fornisce:

✅ **Performance**: 95% più veloce per reload
✅ **Costi**: 70-75% riduzione read operations
✅ **UX**: Caricamenti istantanei
✅ **Semplice**: API trasparente, poche righe di codice
✅ **Sicuro**: Invalidazione automatica dopo modifiche

Il trade-off è minimo: dati potrebbero essere obsoleti fino al TTL, ma questo è accettabile per la maggior parte dei casi d'uso.
