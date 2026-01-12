# Sistema di Cache Firestore

Questo progetto usa **realtime stores + persistence Firestore** come soluzione di default.
La cache custom in-memory e **legacy/fallback** e va usata solo quando realtime non e applicabile.

## Soluzione Attuale (default)

- **Realtime listeners** per liste e dettagli
- **Persistence locale** (IndexedDB) per riaperture pagina/offline
- **Store unico** per evitare doppie letture

Per questo motivo, **non serve** una cache manuale per liste standard.

## Quando usare la cache custom (legacy)

Usa `firestoreCache.ts` solo se:
- La query e **one-shot** e non serve realtime
- La query e **costosa** e vuoi riutilizzarla per pochi minuti
- Non puoi usare `onSnapshot()` (es. operazioni batch o dati derivati)

Evita la cache custom quando i dati devono essere sempre freschi o quando c'e gia un listener realtime.

## File e API disponibili

**File:** `src/scripts/utils/firestoreCache.ts`

**Funzioni:**
- `getCached(key, fetchFn, ttl)`
- `invalidateCache(key)`
- `invalidateCachePattern(pattern)`
- `clearCache()`
- `getCacheStats()`

## Esempio (legacy)

```javascript
import { getCached, invalidateCache } from './utils/firestoreCache.ts';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

async function loadEntities() {
  const snapshot = await getCached(
    'collection:entita',
    async () => {
      const q = query(collection(db, 'entita'), orderBy('created', 'desc'));
      return getDocs(q);
    },
    10 * 60 * 1000 // 10 min
  );

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function createEntity(data) {
  await createEntityApi(data);
  invalidateCache('collection:entita');
}
```

## Linee guida rapide

- **Preferisci** `REALTIME_STORES.md` per liste e tabelle
- **Non mischiare** realtime e cache manuale sulla stessa collection
- **Invalida** sempre dopo create/update/delete
- **TTL corto** (2-15 min) per dati che cambiano

## Riferimenti

- `docs/architecture/REALTIME_STORES.md`
- `docs/architecture/AI_START.md`
