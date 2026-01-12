# 🔄 Realtime State Management Pattern

**Versione:** 1.0
**Data:** 2026-01-11
**Obiettivo:** Pattern per aggiornamento automatico UI con nanostores + Firebase snapshots

---

## 🎯 Problema Risolto

**Prima dell'implementazione:**
- Letture manuali con `getDocs()` o `getDoc()`
- Necessità di ricaricare manualmente dopo ogni modifica (`loadEntities()`)
- UI non sincronizzata con Firestore in tempo reale
- Codice duplicato per gestire il caricamento dati

**Dopo l'implementazione:**
- Listener Firebase `onSnapshot` attivi su collection/documenti
- State management centralizzato con **nanostores**
- UI si aggiorna automaticamente quando Firestore cambia
- Meno codice, più reattività

---

## 📚 Stack Tecnologico

### Nanostores
- **Libreria:** [nanostores](https://github.com/nanostores/nanostores)
- **Dimensione:** < 1KB (non gzipped)
- **Tipo:** Atomic state management
- **Supporto:** Vanilla JS, React, Vue, Svelte, Astro

### Firebase Firestore
- **Feature:** `onSnapshot()` per realtime listeners
- **Tipo:** Server-side reactive updates
- **Latenza:** < 1 secondo per propagazione globale

---

## 🏗️ Architettura Pattern

### Flow Dati
```
┌─────────────────┐
│   Firestore     │
│   (Database)    │
└────────┬────────┘
         │ onSnapshot()
         │ (realtime listener)
         ▼
┌─────────────────┐
│   Store         │
│  (nanostores)  │
└────────┬────────┘
         │ subscribe()
         │ (reactive)
         ▼
┌─────────────────┐
│   UI/Component  │
│   (auto-update) │
└─────────────────┘
```

### Componenti Pattern

1. **Store File** (`src/stores/[entity]Store.ts`)
   - Atom stores (data, loading, error)
   - Listener Firebase con `onSnapshot`
   - Funzioni init/stop per lifecycle

2. **Script File** (`src/scripts/[entity].ts`)
   - Subscribe allo store
   - Render UI quando store cambia
   - NO più chiamate manuali a Firestore
   - Listener avviato solo dopo auth pronta

3. **Layout/Init** (`BaseLayout.astro` o init function)
   - Inizializza listener Firebase dopo `auth.onAuthStateChanged`
   - Cleanup su logout/unmount

4. **Persistence** (`src/lib/firebase-client.ts`)
   - Abilita cache locale Firestore per riaperture pagina/offline

---

## 📋 Pattern 1: Store per Collection (Lista Entita)

### Caso d'uso
- Tabelle con lista entita (utenti, clienti, prodotti)
- Sidebar con lista items
- Dashboard con statistiche

### Template Store: `src/stores/[entity]Store.ts`

```javascript
/**
 * 🎯 PATTERN: Store Realtime per Collection
 *
 * Gestisce una lista di entita da Firestore con aggiornamenti realtime.
 * Usato per tabelle, liste, dashboard.
 *
 * @example
 * // In src/scripts/users.ts
 * import { usersStore, initUsersListener } from '../stores/usersStore.ts';
 *
 * initUsersListener(); // Avvia listener
 * usersStore.subscribe((users) => {
 *   renderTable(users); // UI si aggiorna automaticamente
 * });
 */

import { atom } from 'nanostores';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase-client';

// ============================================
// STORES (Atomic State)
// ============================================

/**
 * Store principale - contiene array di entita
 * @type {import('nanostores').Atom<Array>}
 */
export const [entity]Store = atom([]);

/**
 * Store loading - indica se il listener è in caricamento
 * @type {import('nanostores').Atom<boolean>}
 */
export const [entity]LoadingStore = atom(true);

/**
 * Store errori - contiene messaggi di errore
 * @type {import('nanostores').Atom<string|null>}
 */
export const [entity]ErrorStore = atom(null);

// ============================================
// LIFECYCLE MANAGEMENT
// ============================================

let unsubscribe = null; // Riferimento al listener Firestore

/**
 * Inizializza il listener Firebase per la collection
 *
 * IMPORTANTE:
 * - Chiamare solo UNA volta all'init della pagina
 * - Il listener rimane attivo finché non si chiama stop
 * - Usa onSnapshot per aggiornamenti realtime
 *
 * @returns {void}
 */
export function init[Entity]Listener() {
    // Previeni listener duplicati
    if (unsubscribe) {
        console.log('Listener già attivo per [entity]');
        return;
    }

    [entity]LoadingStore.set(true);
    [entity]ErrorStore.set(null);

    try {
        const [entity]Collection = collection(db, '[collection_name]');

        // ✅ onSnapshot: listener realtime
        unsubscribe = onSnapshot(
            [entity]Collection,
            (snapshot) => {
                // Trasforma snapshot in array di oggetti
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                console.log(`[Entity] aggiornati: ${data.length} elementi`);

                // Aggiorna store → trigger subscribers → UI update
                [entity]Store.set(data);
                [entity]LoadingStore.set(false);
            },
            (error) => {
                console.error('Errore nel listener [entity]:', error);
                [entity]ErrorStore.set(error.message);
                [entity]LoadingStore.set(false);
            }
        );

        console.log('Listener [entity] inizializzato');
    } catch (error) {
        console.error('Errore nell\'inizializzare il listener [entity]:', error);
        [entity]ErrorStore.set(error.message);
        [entity]LoadingStore.set(false);
    }
}

/**
 * Ferma il listener Firebase (cleanup)
 *
 * QUANDO CHIAMARE:
 * - Quando l'utente esce dalla pagina
 * - Quando l'utente fa logout
 * - Prima di distruggere il componente
 *
 * @returns {void}
 */
export function stop[Entity]Listener() {
    if (unsubscribe) {
        unsubscribe(); // Chiama la funzione di unsubscribe di Firebase
        unsubscribe = null;
        console.log('Listener [entity] fermato');
    }
}
```

### ✅ Esempio Concreto: Users Store

**File:** `src/stores/usersStore.ts`

```javascript
import { atom } from 'nanostores';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase-client';

export const usersStore = atom([]);
export const usersLoadingStore = atom(true);
export const usersErrorStore = atom(null);

let unsubscribe = null;

export function initUsersListener() {
    if (unsubscribe) {
        console.log('Listener già attivo per users');
        return;
    }

    usersLoadingStore.set(true);
    usersErrorStore.set(null);

    try {
        const usersCollection = collection(db, 'users');

        unsubscribe = onSnapshot(
            usersCollection,
            (snapshot) => {
                const users = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                console.log(`Users aggiornati: ${users.length} utenti`);
                usersStore.set(users);
                usersLoadingStore.set(false);
            },
            (error) => {
                console.error('Errore nel listener users:', error);
                usersErrorStore.set(error.message);
                usersLoadingStore.set(false);
            }
        );

        console.log('Listener users inizializzato');
    } catch (error) {
        console.error('Errore nell\'inizializzare il listener users:', error);
        usersErrorStore.set(error.message);
        usersLoadingStore.set(false);
    }
}

export function stopUsersListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        console.log('Listener users fermato');
    }
}
```

### Integrazione Script: `src/scripts/[entity].ts`

```javascript
/**
 * 🎯 PATTERN: Integrazione Store in Script
 *
 * Come usare lo store nel componente frontend.
 */

import { [entity]Store, init[Entity]Listener, stop[Entity]Listener } from '../stores/[entity]Store.ts';

let entities = [];
let unsubscribeStore = null;

/**
 * Init page - avvia listener e subscribe
 */
export function init[Entity]Page() {
    // ... setup altri componenti ...

    // Inizializza listener solo dopo auth pronta
    auth.onAuthStateChanged((user) => {
        if (!user) {
            cleanup[Entity]Page();
            return;
        }

        init[Entity]Listener();

        // Subscribe allo store per aggiornamenti UI
        unsubscribeStore = [entity]Store.subscribe((data) => {
            entities = data;
            renderTable(); // 🎯 UI si aggiorna automaticamente
        });
    });
}

/**
 * Cleanup - ferma listener e unsubscribe
 */
export function cleanup[Entity]Page() {
    if (unsubscribeStore) {
        unsubscribeStore();
        unsubscribeStore = null;
    }
    stop[Entity]Listener();
}

/**
 * Render table - NON serve più loadEntities()
 */
function renderTable() {
    const tableData = entities.map(e => [
        e.nome || 'N/D',
        e.email || 'N/D',
        // ... altre colonne
    ]);

    // SimpleDatatables o altro rendering
    if (dataTable) dataTable.destroy();
    dataTable = new simpleDatatables.DataTable('#data-table', {
        data: { headings: [...], data: tableData }
    });
}

/**
 * CRUD Operations - NO più loadEntities() manuale
 */
async function saveEntity(e) {
    e.preventDefault();

    try {
        const api = httpsCallable(functions, '[entity]CreateApi');
        await api(data);

        // ✅ NON serve più loadEntities()
        // Lo store si aggiorna automaticamente tramite onSnapshot

        showSaveMessage('Salvato con successo');
    } catch (error) {
        console.error('Errore:', error);
    }
}

async function deleteEntity(id) {
    try {
        const api = httpsCallable(functions, '[entity]DeleteApi');
        await api({ id });

        // ✅ NON serve più loadEntities()
        // La tabella si aggiorna automaticamente

    } catch (error) {
        console.error('Errore:', error);
    }
}
```

### ✅ Esempio Concreto: Users Script

**File:** `src/scripts/users.ts`

```javascript
import { usersStore, initUsersListener, stopUsersListener } from '../stores/usersStore.ts';
import { db, auth, functions } from '../lib/firebase-client';
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

let entities = [];
let unsubscribeStore = null;

export function initUsersPage() {
    // Setup altri componenti...

    // Inizializza il listener Firebase solo dopo auth pronta
    auth.onAuthStateChanged((user) => {
        if (!user) {
            cleanupUsersPage();
            return;
        }

        initUsersListener();

        // Subscribe allo store per aggiornare la tabella
        unsubscribeStore = usersStore.subscribe((users) => {
            entities = users;
            renderTable();
        });
    });
}

export function cleanupUsersPage() {
    if (unsubscribeStore) {
        unsubscribeStore();
        unsubscribeStore = null;
    }
    stopUsersListener();
}

async function saveEntity(e) {
    e.preventDefault();

    try {
        // ... validazione dati ...

        if (isNew) {
            const userCreateApi = httpsCallable(functions, 'userCreateApi');
            await userCreateApi(requestData);
        } else {
            const userUpdateApi = httpsCallable(functions, 'userUpdateApi');
            await userUpdateApi(updateData);
        }

        // ✅ NON serve più loadEntities()
        // La tabella si aggiorna automaticamente tramite lo store

        showSaveMessage('save-message');
    } catch (error) {
        console.error('Errore nel salvare l\'utente:', error);
    }
}
```

---

## 📋 Pattern 2: Store per Documento Singolo (Profilo Utente)

### Caso d'uso
- Profilo utente corrente
- Dati singola entita in dettaglio
- Form di modifica entita

### Template Store: `src/stores/current[Entity]Store.ts`

```javascript
/**
 * 🎯 PATTERN: Store Realtime per Documento Singolo
 *
 * Gestisce un singolo documento da Firestore con aggiornamenti realtime.
 * Usato per profili utente, dettagli entita, form di modifica.
 *
 * @example
 * // In BaseLayout.astro
 * import { initCurrentUserListener } from '../stores/currentUserStore.ts';
 *
 * onAuthStateChanged(auth, (user) => {
 *   if (user) {
 *     initCurrentUserListener(user.uid); // Avvia listener
 *   }
 * });
 */

import { atom } from 'nanostores';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase-client';

// ============================================
// STORES (Atomic State)
// ============================================

export const current[Entity]Store = atom(null);
export const current[Entity]LoadingStore = atom(true);
export const current[Entity]ErrorStore = atom(null);

// ============================================
// LIFECYCLE MANAGEMENT
// ============================================

let unsubscribe = null;
let current[Entity]Id = null;

/**
 * Inizializza il listener Firebase per un documento specifico
 *
 * @param {string} entityId - ID del documento da ascoltare
 * @returns {void}
 */
export function initCurrent[Entity]Listener(entityId) {
    // Se l'ID è cambiato, ferma il vecchio listener
    if (current[Entity]Id !== entityId) {
        stopCurrent[Entity]Listener();
        current[Entity]Id = entityId;
    }

    // Previeni listener duplicati
    if (unsubscribe) {
        console.log('Listener già attivo per current[Entity]');
        return;
    }

    if (!entityId) {
        console.warn('initCurrent[Entity]Listener chiamato senza entityId');
        current[Entity]Store.set(null);
        current[Entity]LoadingStore.set(false);
        return;
    }

    current[Entity]LoadingStore.set(true);
    current[Entity]ErrorStore.set(null);

    try {
        const entityDocRef = doc(db, '[collection_name]', entityId);

        // ✅ onSnapshot: listener realtime su singolo documento
        unsubscribe = onSnapshot(
            entityDocRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = {
                        id: docSnapshot.id,
                        ...docSnapshot.data()
                    };

                    console.log('Current [entity] aggiornato:', data);
                    current[Entity]Store.set(data);
                    current[Entity]LoadingStore.set(false);

                    // 🎯 OPZIONALE: Side effects (es. aggiorna avatar)
                    // updateAvatarInHeader(data);
                } else {
                    console.warn('[Entity] non trovato in Firestore');
                    current[Entity]Store.set(null);
                    current[Entity]LoadingStore.set(false);
                }
            },
            (error) => {
                console.error('Errore nel listener current[Entity]:', error);
                current[Entity]ErrorStore.set(error.message);
                current[Entity]LoadingStore.set(false);
            }
        );

        console.log('Listener current[Entity] inizializzato per ID:', entityId);
    } catch (error) {
        console.error('Errore nell\'inizializzare il listener current[Entity]:', error);
        current[Entity]ErrorStore.set(error.message);
        current[Entity]LoadingStore.set(false);
    }
}

export function stopCurrent[Entity]Listener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        current[Entity]Id = null;
        console.log('Listener current[Entity] fermato');
    }
}
```

### ✅ Esempio Concreto: Current User Store

**File:** `src/stores/currentUserStore.ts`

```javascript
import { atom } from 'nanostores';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase-client';

export const currentUserProfileStore = atom(null);
export const currentUserLoadingStore = atom(true);
export const currentUserErrorStore = atom(null);

let unsubscribe = null;
let currentUserId = null;

export function initCurrentUserListener(userId) {
    if (currentUserId !== userId) {
        stopCurrentUserListener();
        currentUserId = userId;
    }

    if (unsubscribe) {
        console.log('Listener già attivo per currentUser');
        return;
    }

    if (!userId) {
        console.warn('initCurrentUserListener chiamato senza userId');
        currentUserProfileStore.set(null);
        currentUserLoadingStore.set(false);
        return;
    }

    currentUserLoadingStore.set(true);
    currentUserErrorStore.set(null);

    try {
        const userDocRef = doc(db, 'users', userId);

        unsubscribe = onSnapshot(
            userDocRef,
            (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const userData = {
                        id: docSnapshot.id,
                        ...docSnapshot.data()
                    };

                    console.log('Current user profile aggiornato:', userData);
                    currentUserProfileStore.set(userData);
                    currentUserLoadingStore.set(false);

                    // Aggiorna l'avatar nell'header automaticamente
                    updateAvatarInHeader(userData);
                } else {
                    console.warn('Profilo utente non trovato in Firestore');
                    currentUserProfileStore.set(null);
                    currentUserLoadingStore.set(false);
                }
            },
            (error) => {
                console.error('Errore nel listener currentUser:', error);
                currentUserErrorStore.set(error.message);
                currentUserLoadingStore.set(false);
            }
        );

        console.log('Listener currentUser inizializzato per userId:', userId);
    } catch (error) {
        console.error('Errore nell\'inizializzare il listener currentUser:', error);
        currentUserErrorStore.set(error.message);
        currentUserLoadingStore.set(false);
    }
}

export function stopCurrentUserListener() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
        currentUserId = null;
        console.log('Listener currentUser fermato');
    }
}

// Helper per side effects
function updateAvatarInHeader(userData) {
    const avatarIcon = document.getElementById('avatar-icon');
    if (avatarIcon) {
        const name = userData.nome || userData.email?.split('@')[0] || 'User';
        const fullName = userData.cognome ? `${userData.nome} ${userData.cognome}` : name;

        const url = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&rounded=true`;
        avatarIcon.setAttribute('src', url);
        avatarIcon.setAttribute('alt', fullName);
    }
}
```

### Integrazione Layout: `src/layouts/BaseLayout.astro`

```astro
<script>
  import { auth } from '../lib/firebase-client';
  import { onAuthStateChanged } from 'firebase/auth';
  import { initCurrentUserListener, stopCurrentUserListener } from '../stores/currentUserStore.ts';

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // 1️⃣ Inizializza listener profilo utente
      initCurrentUserListener(user.uid);

      // ... altre inizializzazioni ...
    } else {
      // 2️⃣ Ferma listener su logout
      stopCurrentUserListener();
    }
  });
</script>
```

### Integrazione Script: `src/scripts/profile.ts`

```javascript
import { currentUserProfileStore } from '../stores/currentUserStore.ts';
import { auth, functions } from '../lib/firebase-client';
import { httpsCallable } from "firebase/functions";

let unsubscribeStore = null;

export function initProfilePage() {
    setupEventListeners();

    // Subscribe allo store per aggiornare il form
    unsubscribeStore = currentUserProfileStore.subscribe((profileData) => {
        if (profileData) {
            updateProfileForm(profileData);
        }
    });

    // Controlla se lo store ha già i dati
    auth.onAuthStateChanged((user) => {
        if (user) {
            const currentProfile = currentUserProfileStore.get();
            if (currentProfile) {
                updateProfileForm(currentProfile);
            }
        }
    });
}

export function cleanupProfilePage() {
    if (unsubscribeStore) {
        unsubscribeStore();
        unsubscribeStore = null;
    }
}

// Aggiorna il form con i dati dallo store
function updateProfileForm(data) {
    const nomeInput = document.getElementById('profile-nome');
    const cognomeInput = document.getElementById('profile-cognome');

    if (nomeInput) nomeInput.value = data.nome || '';
    if (cognomeInput) cognomeInput.value = data.cognome || '';
    // ... altri campi
}

async function saveProfile(e) {
    e.preventDefault();

    try {
        const userSelfUpdateApi = httpsCallable(functions, 'userSelfUpdateApi');
        await userSelfUpdateApi(updateData);

        // ✅ NON serve più ricaricare o aggiornare l'avatar
        // Lo store si aggiorna automaticamente tramite onSnapshot

        showSaveMessage('Profilo aggiornato con successo!');
    } catch (error) {
        console.error('Errore nel salvare il profilo:', error);
    }
}
```

---

## 🗂️ Struttura Directory

```
src/
├── stores/
│   ├── usersStore.ts              # Lista utenti (collection)
│   ├── currentUserStore.ts        # Profilo utente corrente (documento)
│   ├── clientiStore.ts            # Lista clienti (collection)
│   └── [entity]Store.ts           # Altri stores...
│
├── scripts/
│   ├── users.ts                   # Logica utenti + subscribe
│   ├── profile.ts                 # Logica profilo + subscribe
│   └── [entity].ts                # Altri scripts...
│
└── layouts/
    └── BaseLayout.astro           # Init listener globali
```

---

## 🎨 Convenzioni di Naming

### Store Files
- **Collection:** `[entity]Store.ts` (plurale)
  - Esempio: `usersStore.ts`, `clientiStore.ts`, `prodottiStore.ts`
- **Single Document:** `current[Entity]Store.ts` (singolare)
  - Esempio: `currentUserStore.ts`, `currentClienteStore.ts`

### Exported Names

#### Collection Store
```javascript
export const [entity]Store = atom([]);           // usersStore
export const [entity]LoadingStore = atom(true);  // usersLoadingStore
export const [entity]ErrorStore = atom(null);    // usersErrorStore
export function init[Entity]Listener() {}        // initUsersListener
export function stop[Entity]Listener() {}        // stopUsersListener
```

#### Single Document Store
```javascript
export const current[Entity]Store = atom(null);           // currentUserStore
export const current[Entity]LoadingStore = atom(true);    // currentUserLoadingStore
export const current[Entity]ErrorStore = atom(null);      // currentUserErrorStore
export function initCurrent[Entity]Listener(id) {}        // initCurrentUserListener
export function stopCurrent[Entity]Listener() {}          // stopCurrentUserListener
```

---

## ✅ Checklist Implementazione

Quando implementi realtime stores per una nuova entita, segui questa checklist:

### Per Collection (Lista)
- [ ] Creare `src/stores/[entity]Store.ts`
- [ ] Esportare 3 atoms: `[entity]Store`, `[entity]LoadingStore`, `[entity]ErrorStore`
- [ ] Implementare `init[Entity]Listener()` con `onSnapshot(collection(...))`
- [ ] Implementare `stop[Entity]Listener()`
- [ ] Importare store in `src/scripts/[entity].ts`
- [ ] Chiamare `init[Entity]Listener()` in `init[Entity]Page()`
- [ ] Subscribe a `[entity]Store` e aggiornare UI nel callback
- [ ] Esportare `cleanup[Entity]Page()` che chiama `stop[Entity]Listener()`
- [ ] Rimuovere tutte le chiamate manuali a `getDocs()`, `loadEntities()`
- [ ] Rimuovere `loadEntities()` dopo CRUD operations

### Per Single Document (Profilo)
- [ ] Creare `src/stores/current[Entity]Store.ts`
- [ ] Esportare 3 atoms: `current[Entity]Store`, `current[Entity]LoadingStore`, `current[Entity]ErrorStore`
- [ ] Implementare `initCurrent[Entity]Listener(id)` con `onSnapshot(doc(...))`
- [ ] Implementare `stopCurrent[Entity]Listener()`
- [ ] Chiamare `initCurrent[Entity]Listener()` nel layout o auth handler
- [ ] Subscribe a `current[Entity]Store` nello script
- [ ] Rimuovere tutte le chiamate manuali a `getDoc()`, `getDocFromServer()`
- [ ] Rimuovere polling/wait functions (es. `waitForProfileUpdate()`)

---

## 🚀 Vantaggi Pattern

### Performance
✅ **Meno read operations:** onSnapshot riutilizza la connessione WebSocket
✅ **Cache automatica:** Firebase gestisce offline persistence
✅ **Debouncing:** Batch updates da Firestore

### Developer Experience
✅ **Meno codice:** Elimina funzioni `loadEntities()`, `waitFor...()`, polling
✅ **Dichiarativo:** UI = f(state), non imperativo
✅ **Debugging:** Console log automatici su ogni update

### User Experience
✅ **Realtime:** Modifiche visibili in <1s su tutti i client
✅ **Multi-tab:** Sincronizzazione automatica tra tab del browser
✅ **Collaborazione:** Più utenti vedono cambiamenti in tempo reale

---

## ⚠️ Considerazioni Importanti

### Costi Firestore
- **Read:** `onSnapshot` conta come 1 read iniziale + 1 read per ogni modifica
- **Ottimizzazione:** Usa `where()` per filtrare dati non necessari
- **Esempio:** `where('status', '==', true)` riduce listener su entita archiviate

### Memory Leaks
- **SEMPRE unsubscribe:** Chiamare `stop[Entity]Listener()` su unmount/logout
- **Pattern export cleanup:** Esporta funzione `cleanup[Entity]Page()`
- **Listeners duplicati:** Controllo `if (unsubscribe)` previene leak

### Offline Support
- Firebase gestisce offline cache automaticamente
- Store si aggiorna quando la connessione ritorna
- NO codice custom necessario

---

## 📚 Riferimenti Pattern Correlati

Questo pattern si integra con:
- [PATTERNS.md](PATTERNS.md) - Pattern CRUD backend
- [CACHE_SYSTEM.md](CACHE_SYSTEM.md) - Cache complementare per query statiche
- [SERVER_SIDE_VALIDATION.md](SERVER_SIDE_VALIDATION.md) - Validazione dati modificati

---

## 📝 Note Finali

### Quando usare questo pattern
✅ Dati che cambiano frequentemente
✅ UI che devono riflettere stato condiviso
✅ Collaborazione multi-utente
✅ Tabelle/liste master-detail

### Quando NON usare questo pattern
❌ Dati immutabili (configurazioni)
❌ Query one-time (report export)
❌ Grandi dataset (>1000 items) → usa pagination + cache
❌ Dati sensibili che non devono essere cached lato client

---

## 🎯 Implementazioni Esistenti

### ✅ Entita implementate con questo pattern:

1. **Users** (`src/stores/usersStore.ts`)
   - Collection store per lista utenti
   - Implementato in: `src/scripts/users.ts`
   - Listener inizializzato in: `initUsersPage()`

2. **Current User Profile** (`src/stores/currentUserStore.ts`)
   - Document store per profilo utente corrente
   - Implementato in: `src/scripts/profile.ts`, `src/layouts/BaseLayout.astro`
   - Listener inizializzato in: `BaseLayout.astro` (onAuthStateChanged)
   - Side effect: Aggiorna automaticamente avatar nell'header

3. **Clienti** (`src/stores/clientiStore.ts`)
   - Collection store per anagrafica clienti
   - Implementato in: `src/scripts/anagrafica-clienti.ts`
   - Listener inizializzato in: `initPageAnagraficaClientiPage()`

### 🔄 Cloud Functions modificate:

#### Rimosse API di lettura (READ operations)
- ❌ `userListApi` - Rimossa, lista gestita client-side con onSnapshot
- ❌ `listClientiApi` - Rimossa, lista gestita client-side con onSnapshot

#### Mantenute API di scrittura (CUD operations)
- ✅ `userCreateApi`, `userUpdateApi`, `userDeleteApi`
- ✅ `createClienteApi`, `updateClienteApi`, `deleteClienteApi`

### 📐 Security Rules aggiornate:

```javascript
// Users collection
match /users/{userId} {
  allow get: if request.auth != null;
  allow list: if request.auth != null;  // ✅ Permesso per onSnapshot
  // ...
}

// Clienti collection
match /anagrafica_clienti/{clientId} {
  allow get: if request.auth != null;
  allow list: if request.auth != null;  // ✅ Permesso per onSnapshot
  allow write: if false;  // ❌ Solo tramite Cloud Functions
}
```

---

**Pattern completato e testato!** Pronto per essere applicato ad altre entita del progetto.
