# 📐 Pattern e Convenzioni - Template Base App

**Versione:** 1.0
**Data:** 2026-01-08
**Obiettivo:** Documentazione per AI - Pattern replicabili per nuove entita

---

## 🎯 Come Usare Questo Attachment

Questo attachment definisce i **pattern standard** per creare nuove entita (es: prodotti, fornitori, ordini).
Ogni nuova entita DEVE seguire questi pattern per garantire:
- ✅ Coerenza del codice
- ✅ Facilità di manutenzione
- ✅ Replicabilità da parte di AI
- ✅ Testing automatico

---

## 📋 Checklist per Nuova Entita

Quando crei una nuova entita (es: `prodotti`), devi creare questi file:

### 1. Schema e Factory
- [ ] `shared/schemas/entityFactory.ts` - Aggiungi funzione `createProdotto()`
- [ ] `shared/schemas/zodSchemas.ts` - Aggiungi `ProdottoSchema` e `ProdottoUpdateSchema`

### 2. API Backend
- [ ] `functions/api/prodotti.ts` - CRUD CUD (Create, Update, Delete). La lista e realtime via store.

### 3. Test
- [ ] `tests/functions/prodotti.test.js` - Test per tutte le operazioni CRUD

### 4. Frontend
- [ ] `src/pages/prodotti.astro` - Pagina lista/gestione
- [ ] `src/scripts/prodotti.ts` - Logica frontend
- [ ] `src/stores/prodottiStore.ts` - Store realtime per la lista

### 5. Firestore Rules
- [ ] `firestore.rules` - Aggiungi regole per collection `prodotti`

---

## 📚 Entita Template Esistenti

Il progetto include 3 entita completamente documentate che puoi usare come template:

### 1. **Clienti** (CRUD Standard)
File di riferimento più completo per entita con CRUD classico.

- 📄 **API**: [functions/api/clienti.ts](functions/api/clienti.ts)
- 🏗️ **Factory**: [shared/schemas/entityFactory.ts](shared/schemas/entityFactory.ts) - `createCliente()`
- 🧪 **Test**: [tests/functions/clienti.test.js](tests/functions/clienti.test.js)
- 🗄️ **Collection**: `clienti`
- 👥 **Permessi**: Admin per CUD, Operatore+ per R

**Quando usare come template:**
- Entita con campi semplici (stringhe, numeri, booleani)
- CRUD standard senza logiche complesse
- Esempi: prodotti, fornitori, categorie, tag

### 2. **Users** (Firebase Auth + Firestore)
Template per entita che usano Firebase Authentication.

- 📄 **API**: [functions/api/users.ts](functions/api/users.ts)
- 🏗️ **Factory**: [shared/schemas/entityFactory.ts](shared/schemas/entityFactory.ts) - `createUtente()`
- 🧪 **Test**: [tests/functions/users.test.js](tests/functions/users.test.js)
- 🗄️ **Collection**: `users` + Firebase Auth
- 👥 **Permessi**: Admin only, con controllo gerarchico ruoli

**Quando usare come template:**
- Entita che richiedono autenticazione
- Gestione ruoli e permessi granulari
- Sincronizzazione tra Firebase Auth e Firestore

**Note speciali:**
- Gestisce duplicati email (sync invece di errore)
- Verifica gerarchica permessi (admin non può eliminare superuser)
- Dual-storage (Auth per login, Firestore per metadati)

### 3. **Attachments** (Firestore + Storage)
Template per entita che gestiscono file.

- 📄 **API**: [functions/api/attachments.ts](functions/api/attachments.ts)
- 🏗️ **Factory**: [shared/schemas/entityFactory.ts](shared/schemas/entityFactory.ts) - `createAttachment()`
- 🗄️ **Collection**: `attachments`
- 💾 **Storage**: Firebase Storage bucket
- 👥 **Permessi**: Authenticated per C, Admin per UD

**Quando usare come template:**
- Entita con file allegati (PDF, immagini, etc.)
- Gestione upload/download
- Metadata + file binario

**Note speciali:**
- Delete elimina sia record Firestore che file Storage
- Gestione orphaned files (file senza record)
- Validazione MIME type e storage path

---

## 🏗️ PATTERN 1: Schema Entity Factory (con Zod)

**File:** `shared/schemas/entityFactory.ts`

### Template Base:

```javascript
/**
 * 🎯 PATTERN: Entity Factory Function
 *
 * Crea un oggetto [ENTITY_NAME] validato e strutturato.
 * Usato sia lato client che server per garantire consistenza.
 *
 * @param {Object} params - Parametri dell'entita
 * @param {string} params.[CAMPO_OBBLIGATORIO] - Descrizione campo
 * @param {string} [params.[CAMPO_OPZIONALE]] - Descrizione campo opzionale
 * @param {string|null} [params.createdBy] - UID utente creatore (null = SYSTEM)
 * @param {string|null} [params.createdByEmail] - Email utente creatore (null = SYSTEM)
 * @returns {Object} Oggetto [ENTITY_NAME] validato
 * @throws {Error} Se i dati non rispettano lo schema Zod
 */
export function create[EntityName]({
  // CAMPI OBBLIGATORI
  [campo_obbligatorio],

  // CAMPI OPZIONALI (con default)
  [campo_opzionale] = null,
  status = true,

  // CAMPI AUDIT (sempre presenti)
  createdBy = null,
  createdByEmail = null
} = {}) {
  // 1. VALIDAZIONE: usa Zod
  const parsed = [EntityName]Schema.parse({
    campo_obbligatorio,
    campo_opzionale,
    status
  });

  // 2. AUDIT: normalizza campi audit
  const auditFields = normalizeAuditFields(createdBy, createdByEmail);

  // 3. RETURN: Oggetto validato con tutti i campi tipizzati
  return {
    // Campi obbligatori
    [campo_obbligatorio]: parsed.campo_obbligatorio,

    // Campi opzionali (normalizzati)
    [campo_opzionale]: parsed.campo_opzionale ?? null,
    status: parsed.status,

    // Campi audit (sempre presenti)
    created: SERVER_TIMESTAMP,
    changed: SERVER_TIMESTAMP,
    createdBy: auditFields.createdBy,
    createdByEmail: auditFields.createdByEmail,
    lastModifiedBy: auditFields.lastModifiedBy,
    lastModifiedByEmail: auditFields.lastModifiedByEmail
  };
}
```

### ✅ Esempio Concreto - Cliente:

```javascript
export function createCliente({
  ragione_sociale,  // OBBLIGATORIO
  email = null,     // OPZIONALE
  telefono = null,
  partita_iva = null,
  status,
  createdBy = null,
  createdByEmail = null
} = {}) {
  const parsed = ClienteSchema.parse({
    ragione_sociale,
    email,
    telefono,
    partita_iva,
    status
  });

  const auditFields = normalizeAuditFields(createdBy, createdByEmail);

  return {
    ragione_sociale: parsed.ragione_sociale,
    email: parsed.email ?? null,
    telefono: parsed.telefono ?? null,
    partita_iva: parsed.partita_iva ?? null,
    status: parsed.status,
    created: SERVER_TIMESTAMP,
    changed: SERVER_TIMESTAMP,
    createdBy: auditFields.createdBy,
    createdByEmail: auditFields.createdByEmail,
    lastModifiedBy: auditFields.lastModifiedBy,
    lastModifiedByEmail: auditFields.lastModifiedByEmail
  };
}
```

---

## 🔌 PATTERN 2: API Backend CRUD

**File:** `functions/api/[entita].ts`

### Struttura Standard:

```javascript
/**
 * 🎯 PATTERN: API CRUD per [ENTITY_NAME]
 *
 * Operazioni disponibili:
 * - CREATE: Crea nuova entita (solo admin)
 * - UPDATE: Aggiorna entita esistente (admin)
 * - DELETE: Elimina entita (admin)
 * - LIST: gestita da realtime store lato client (no API list)
 */

import { onCall, HttpsError } from "firebase-functions/v2/https"; // Funzioni Callable
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { requireAdmin } from "../utils/authHelpers.ts"; // Helper per sicurezza
import { [EntityName]Schema, [EntityName]UpdateSchema } from "../../shared/schemas/zodSchemas.ts"; // Schemi Zod
import { create[EntityName] } from "../../shared/schemas/entityFactory.ts"; // Factory
import { region, corsOrigins } from "../config.ts";
import { logAudit, AuditAction } from "../utils/auditLogger.ts";

// Inizializza Firebase Admin
if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

// Nome collection Firestore
const COLLECTION_NAME = '[entita]';

/**
 * 🎯 STEP 1: Validazione Dati
 *
 * Valida i dati usando lo schema Zod.
 * Lancia HttpsError se i dati non sono validi.
 * @param {object} data - I dati da validare
 * @param {boolean} isPartial - Se true, usa lo schema parziale per UPDATE
 * @returns {object} I dati validati e tipizzati
 */
function validate[EntityName]Data(data: any, isPartial = false) {
    const schema = isPartial ? [EntityName]UpdateSchema : [EntityName]Schema;
    const result = schema.safeParse(data);

    if (!result.success) {
        // Estrae il primo errore per un messaggio chiaro
        const firstError = result.error.errors[0];
        const errorMessage = `${firstError.path.join('.')}: ${firstError.message}`;
        throw new HttpsError('invalid-argument', errorMessage);
    }
    return result.data;
}

/**
 * 🎯 CREATE: Crea nuova entita
 *
 * Permessi: Solo ADMIN
 * Input: { ...campi entita }
 * Output: { id, ...dati entita }
 */
export const [entita]CreateApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    // 1. SICUREZZA: Verifica permessi
    await requireAdmin(request);

    const { uid, token } = request.auth;
    const data = request.data;

    try {
        // 2. VALIDAZIONE: Controlla dati con Zod
        const validatedData = validate[EntityName]Data(data);

        // 3. BUSINESS LOGIC: Crea oggetto con factory
        const nuovo[EntityName] = create[EntityName]({
            ...data,
            lastModifiedBy: uid,
            lastModifiedByEmail: token.email,
        });

        // 4. DATABASE: Salva in Firestore
        const docRef = await db.collection(COLLECTION_NAME).add(nuovo[EntityName]);

        // 5. AUDIT LOG: Registra azione per tracciabilità (chi, cosa, quando)
        await logAudit({
            entityType: '[entita]',  // es: 'clienti', 'users', 'attachments'
            entityId: docRef.id,
            action: AuditAction.CREATE,
            userId: uid,
            userEmail: token.email,
            newData: nuovo[EntityName],
            source: 'web'
        });

        console.log(`Utente ${uid} ha creato [entita] ${docRef.id}`);

        return { id: docRef.id, ...nuovo[EntityName] };

    } catch (error) {
        console.error("Errore durante la creazione:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile creare [entita].');
    }
});

/**
 * 🎯 UPDATE: Aggiorna entita esistente
 *
 * Permessi: Solo ADMIN
 * Input: { id, ...campi da aggiornare }
 * Output: { message: "..." }
 */
export const [entita]UpdateApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id, ...updateData } = request.data;

    if (!id) {
        throw new HttpsError('invalid-argument', 'ID [entita] è obbligatorio.');
    }

    try {
        // Valida i dati con lo schema parziale per l'update
        const validatedData = validate[EntityName]Data(updateData, true);

        const docRef = db.collection(COLLECTION_NAME).doc(id);

        // Recupera dati attuali per l'audit log (before/after comparison)
        const oldDoc = await docRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;

        // Aggiunge timestamp e campi audit all'aggiornamento
        const dataToUpdate = {
            ...validatedData,
            changed: FieldValue.serverTimestamp(),
        };

        await docRef.update(dataToUpdate);

        // AUDIT LOG: Registra modifica con dati before/after
        await logAudit({
            entityType: '[entita]',
            entityId: id,
            action: AuditAction.UPDATE,
            userId: uid,
            userEmail: request.auth.token.email,
            oldData: oldData,
            newData: dataToUpdate,
            source: 'web'
        });

        console.log(`Utente ${uid} ha aggiornato [entita] ${id}`);

        return { message: "[Entita] aggiornato con successo." };

    } catch (error) {
        console.error("Errore durante l'aggiornamento:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile aggiornare [entita].');
    }
});

/**
 * 🎯 DELETE: Elimina entita
 *
 * Permessi: Solo ADMIN
 * Input: { id }
 * Output: { message: "..." }
 */
export const [entita]DeleteApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireAdmin(request);

    const { uid } = request.auth;
    const { id } = request.data;

    if (!id) {
        throw new HttpsError('invalid-argument', 'ID [entita] è obbligatorio.');
    }

    try {
        const docRef = db.collection(COLLECTION_NAME).doc(id);

        // Recupera dati prima di eliminare per l'audit log
        const oldDoc = await docRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;

        await docRef.delete();

        // AUDIT LOG: Registra eliminazione con dati rimossi
        await logAudit({
            entityType: '[entita]',
            entityId: id,
            action: AuditAction.DELETE,
            userId: uid,
            userEmail: request.auth.token.email,
            oldData: oldData,
            source: 'web'
        });

        console.log(`Utente ${uid} ha eliminato [entita] ${id}`);

        return { message: "[Entita] eliminato con successo." };

    } catch (error) {
        console.error("Errore durante l'eliminazione:", error);
        throw new HttpsError('internal', 'Impossibile eliminare [entita].');
    }
});

// Lista: realtime store lato client (vedi REALTIME_STORES.md)
```

---

## 🧪 PATTERN 3: Test Automatici

**File:** `tests/functions/[entita].test.js`

### Template Test:

```javascript
/**
 * 🎯 PATTERN: Test CRUD per [ENTITY_NAME]
 *
 * Test coperti:
 * - CREATE con dati validi
 * - CREATE con dati invalidi
 * - UPDATE
 * - DELETE
 * - Controllo permessi (admin/operatore)
 */

import { expect } from 'chai';
import * as test from 'firebase-functions-test';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
    [entita]CreateApi,
    [entita]UpdateApi,
    [entita]DeleteApi
} from './api/[entita].ts';

const testEnv = test({
    projectId: 'base-app-12108'
});

const db = getFirestore();
const auth = getAuth();

describe('API [EntityName]', () => {
    afterEach(async () => {
        // Pulizia: elimina attachments di test
        const snapshot = await db.collection('[entita]')
            .where('lastModifiedBy', 'in', ['admin-test', 'operatore-test'])
            .get();

        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    });

    after(() => {
        testEnv.cleanup();
    });

    /**
     * TEST CREATE
     */
    it('dovrebbe creare [entita] con dati validi', async () => {
        const wrapped = test.wrap([entita]CreateApi);
        const adminUser = {
            uid: 'admin-test',
            token: { email: 'admin@test.com' }
        };

        // Crea utente admin nel DB
        await db.collection('users').doc(adminUser.uid).set({
            ruolo: ['admin']
        });

        const payload = {
            [campo_obbligatorio]: 'Test Value',
            // ... altri campi
        };

        const result = await wrapped({
            data: payload,
            auth: adminUser
        });

        expect(result).to.have.property('id');
        expect(result.[campo_obbligatorio]).to.equal('Test Value');
    });

    /**
     * TEST VALIDAZIONE
     */
    it('dovrebbe rifiutare creazione senza campi obbligatori', async () => {
        const wrapped = test.wrap([entita]CreateApi);
        const adminUser = {
            uid: 'admin-test2',
            token: { email: 'admin2@test.com' }
        };

        await db.collection('users').doc(adminUser.uid).set({
            ruolo: ['admin']
        });

        const payloadInvalido = {};

        try {
            await wrapped({ data: payloadInvalido, auth: adminUser });
            expect.fail('Dovrebbe lanciare errore');
        } catch (error) {
            expect(error.message).to.include('obbligatorio');
        }
    });

    /**
     * TEST UPDATE
     */
    it('dovrebbe aggiornare [entita] esistente', async () => {
        // Implementazione test update...
    });

    /**
     * TEST DELETE
     */
    it('dovrebbe eliminare [entita]', async () => {
        // Implementazione test delete...
    });

    /**
     * TEST PERMESSI
     */
    it('dovrebbe negare accesso a operatore per CREATE', async () => {
        const wrapped = test.wrap([entita]CreateApi);
        const operatoreUser = {
            uid: 'operatore-test',
            token: { email: 'op@test.com' }
        };

        await db.collection('users').doc(operatoreUser.uid).set({
            ruolo: ['operatore']
        });

        const payload = { [campo_obbligatorio]: 'Test' };

        try {
            await wrapped({ data: payload, auth: operatoreUser });
            expect.fail('Dovrebbe negare accesso');
        } catch (error) {
            expect(error.message).to.include('amministratori');
        }
    });
});
```

---

## 📝 Esempio Completo: Da Clienti a Prodotti

### Prima: Clienti (Esistente)

**Factory:**
```javascript
createCliente({ ragione_sociale, email, ... })
```

**API:**
- `clienteCreateApi`
- `clienteUpdateApi`
- `clienteDeleteApi`
- Lista via realtime store (no API list)

**Collection:** `clienti`

### Dopo: Prodotti (Nuovo)

**Factory:**
```javascript
createProdotto({
  nome,           // campo obbligatorio
  codice = null,  // campo opzionale
  prezzo = 0,
  categoria = null,
  status = true,
  lastModifiedBy = null,
  lastModifiedByEmail = null
})
```

**API:**
- `prodottoCreateApi`
- `prodottoUpdateApi`
- `prodottoDeleteApi`
- Lista via realtime store (no API list)

**Collection:** `prodotti`

---

## 🚀 Convenzioni di Naming

### Camel Case vs Snake Case

- **Frontend/JS:** `camelCase` → `ragioneSociale`
- **Firestore/DB:** `snake_case` → `ragione_sociale`
- **Funzioni:** `camelCase` → `createCliente()`
- **API Export:** `camelCase` → `clienteCreateApi`
- **Collections:** `snake_case` → `clienti`

### Nomi File

- **API:** `functions/api/[entita].ts` (plurale)
- **Test:** `tests/functions/[entita].test.js` (plurale)
- **Frontend:** `src/scripts/[entita].ts` (singolare con trattino)
- **Pagina:** `src/pages/[entita].astro`
- **Store:** `src/stores/[entita]Store.ts`

---

## 📎 Associare Attachments alle Entita

Il sistema di gestione attachments è **già predisposto** per funzionare con qualsiasi entita. Non devi creare nuove API o backend, ma solo collegare il componente frontend.

### 🎯 Come Funziona

I attachments sono salvati in una **collection centrale** (`attachments`) con metadata che puntano all'entita associata:

```javascript
{
  nome: "fattura.pdf",
  tipo: "application/pdf",
  storagePath: "attachments/ABC123/1234567890_fattura.pdf",
  metadata: {
    entityId: "ABC123",              // ID dell'entita (cliente, prodotto, etc.)
    entityCollection: "clienti",  // Nome collection
    url: "https://...",
    size: 123456,
    description: "Fattura 2024"
  },
  lastModifiedBy: "user123",
  lastModifiedByEmail: "user@example.com",
  created: Timestamp
}
```

### ✅ 3 Passi per Aggiungere Attachments a una Nuova Entita

#### PASSO 1: Aggiungi Tab Attachments alla Pagina Astro

Nel file `src/pages/[entita].astro`, aggiungi il tab attachments nella sidebar:

```html
<!-- Tab buttons -->
<div class="tabs">
    <button class="tab-link active" data-tab="generale">Dati Generali</button>
    <button class="tab-link" data-tab="attachments">Attachments</button>
    <button class="tab-link" data-tab="azioni">Azioni</button>
</div>

<!-- Tab content -->
<div id="tab-attachments" class="tab-content">
    <div id="file-drop-area" class="file-drop-area" style="display: none;">
        <p>Trascina i file qui o clicca per selezionare</p>
        <input type="file" id="document-upload" multiple hidden>
    </div>
    <div id="document-preview-list" class="file-preview-list"></div>
</div>
```

#### PASSO 2: Importa e Configura DocumentUtils nel Frontend

Nel file `src/scripts/[entita].ts`:

```javascript
// Import
import * as attachmentUtils from './utils/attachmentUtils.ts';

// Setup (nella funzione init)
export function init[Entita]Page() {
    const db = getFirestore();
    attachmentUtils.setup({
        db,
        storage,
        auth,
        functions,
        entityCollection: '[entita]'  // Nome collection della tua entita
    });
    // ... resto del codice
}

// Quando salvi una nuova entita
if (isNew) {
    const createApi = httpsCallable(functions, 'create[Entita]Api');
    const result = await createApi(payloadToSend);
    const id = result.data?.id;
    if (id) {
        currentEntityId = id;
        showTabsForExistingEntity();
        attachmentUtils.listenForAttachments(id);  // ✅ Attiva gestione attachments
        actionUtils.loadActions(id);
    }
}

// Quando modifichi un'entita esistente
const editEntity = async (id) => {
    currentEntityId = id;
    // ... carica dati entita
    showTabsForExistingEntity();
    attachmentUtils.listenForAttachments(id);  // ✅ Carica attachments esistenti
    actionUtils.loadActions(id);
    openSidebar();
};
```

#### PASSO 3: Nascondi Tab per Nuove Entita

Le nuove entita non hanno ancora un ID, quindi nascondi il tab attachments:

```javascript
function hideTabsForNewEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="azioni"]')
        .forEach(t => t.style.display = 'none');
    document.querySelectorAll('#tab-attachments, #tab-azioni')
        .forEach(t => t.style.display = 'none');
}

function showTabsForExistingEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="azioni"]')
        .forEach(t => t.style.display = '');
    document.querySelectorAll('#tab-attachments, #tab-azioni')
        .forEach(t => t.style.display = '');
}
```

### 🔍 Query Firestore per Attachments

Firestore viene interrogato automaticamente da `attachmentUtils` con:

```javascript
query(
    collection(db, 'attachments'),
    where("metadata.entityId", "==", entityId),
    orderBy("created", "desc")
)
```

### 📋 Firestore Security Rules

**IMPORTANTE:** Assicurati che le regole permettano la lettura per campo nested:

```javascript
match /attachments/{docId} {
  allow read: if request.auth != null &&
    (resource.data.metadata.entityId == request.auth.uid ||
     hasRole('operatore'));

  allow create: if request.auth != null;
  allow update, delete: if hasRole('admin');
}
```

### ✅ Esempio Completo: Prodotti

Copia questo pattern per aggiungere attachments ai prodotti:

```javascript
// src/scripts/prodotti.ts

import { storage, auth, functions } from '../lib/firebase-client';
import { doc, getFirestore } from "firebase/firestore";
import * as attachmentUtils from './utils/attachmentUtils.ts';
import * as actionUtils from './utils/actionUtils.ts';
import { httpsCallable } from "firebase/functions";

let currentEntityId = null;

export function initProdottiPage() {
    const db = getFirestore();

    // ✅ Setup DocumentUtils con entityCollection
    attachmentUtils.setup({
        db,
        storage,
        auth,
        functions,
        entityCollection: 'prodotti'
    });

    actionUtils.setup({ db, auth, functions, entityCollection: 'prodotti' });
    setupEventListeners();
    // Lista gestita da store realtime (no loadEntities)
}

async function saveEntity(e) {
    e.preventDefault();
    const isNew = !currentEntityId;

    // ... raccolta dati ...

    if (isNew) {
        const createApi = httpsCallable(functions, 'createProdottoApi');
        const result = await createApi(payloadToSend);
        const id = result.data?.id;
        if (id) {
            currentEntityId = id;
            document.getElementById('entity-id').value = id;
            showTabsForExistingEntity();

            // ✅ Attiva gestione attachments
            attachmentUtils.listenForAttachments(id);
            actionUtils.loadActions(id);
        }
    } else {
        // ... update ...
    }
}

const editEntity = async (id) => {
    currentEntityId = id;
    // ... carica dati prodotto ...

    showTabsForExistingEntity();

    // ✅ Carica attachments associati
    attachmentUtils.listenForAttachments(id);
    actionUtils.loadActions(id);

    openSidebar();
};

function hideTabsForNewEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="azioni"]')
        .forEach(t => t.style.display = 'none');
    document.querySelectorAll('#tab-attachments, #tab-azioni')
        .forEach(t => t.style.display = 'none');
}

function showTabsForExistingEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="azioni"]')
        .forEach(t => t.style.display = '');
    document.querySelectorAll('#tab-attachments, #tab-azioni')
        .forEach(t => t.style.display = '');
}
```

### 🚀 Vantaggi di Questo Approccio

✅ **Riutilizzabile:** Stesso codice per tutte le entita
✅ **Zero backend:** API attachments già pronte
✅ **Audit automatico:** Ogni upload tracciato
✅ **Storage organizzato:** File separati per entita
✅ **Query efficienti:** Index su `metadata.entityId`

### 📝 Note Importanti

1. **Non creare nuove API attachments** - Usa quelle esistenti (`createAttachmentRecordApi`, `deleteAttachmentApi`)
2. **entityCollection deve corrispondere** - Deve essere lo stesso nome usato per audit e collection
3. **Tab sempre nascosto per nuove entita** - Gli upload richiedono un ID salvato
4. **Cleanup automatico Storage** - L'eliminazione del attachment rimuove anche il file fisico

---

## 💬 Associare Comments alle Entita

Il sistema di gestione comments è **già predisposto** per funzionare con qualsiasi entita, esattamente come gli attachments. Non devi creare nuove API o backend, ma solo collegare il componente frontend.

### 🎯 Come Funziona

I comments sono salvati in una **collection centrale** (`comments`) con metadata che puntano all'entita associata:

```javascript
{
  text: "Contattare il cliente per preventivo 2024",
  entityId: "ABC123",              // ID dell'entita (cliente, prodotto, etc.)
  entityCollection: "clienti",  // Nome collection
  lastModifiedBy: "user123",
  lastModifiedByEmail: "user@example.com",
  created: "2026-01-09T10:30:00.000Z"
}
```

### 🔄 Differenze tra Comments e Attachments

| Feature | Attachments | Comments |
|---------|-------------|----------|
| **Storage** | Firestore + Storage | Solo Firestore |
| **Struttura** | `metadata.entityId` | `entityId` diretto |
| **Query Index** | `metadata.entityId` + `created` | `entityId` + `entityCollection` + `created` |
| **Permessi Delete** | Solo admin | Admin o creatore |
| **Audit Log** | Salvato su parent entity | Salvato su parent entity |

### ✅ 3 Passi per Aggiungere Comments a una Nuova Entita

#### PASSO 1: Aggiungi Tab Note alla Pagina Astro

Nel file `src/pages/[entita].astro`, aggiungi il tab note nella sidebar:

```html
<!-- Tab buttons -->
<div class="tab-nav">
    <button type="button" class="tab-link active" data-tab="anagrafica">Anagrafica</button>
    <button type="button" class="tab-link" data-tab="attachments">Documenti</button>
    <button type="button" class="tab-link" data-tab="note">Note</button>
    <button type="button" class="tab-link" data-tab="azioni">Azioni</button>
</div>

<!-- Tab content -->
<div id="tab-note" class="tab-content">
    <div class="form-group">
        <label for="comment-text">Aggiungi una nota</label>
        <textarea id="comment-text" rows="4" placeholder="Scrivi una nota..."></textarea>
    </div>
    <div class="form-group">
        <button type="button" id="save-comment-btn" class="btn btn-small">Salva Nota</button>
    </div>
    <div id="comment-form" style="display: none;"></div>
    <div id="comment-list"></div>
</div>
```

#### PASSO 2: Importa e Configura CommentUtils nel Frontend

Nel file `src/scripts/[entita].ts`:

```javascript
// Import
import * as commentUtils from './utils/commentUtils.ts';

// Setup (nella funzione init)
export function init[Entita]Page() {
    const db = getFirestore();
    commentUtils.setup({
        db,
        auth,
        functions,
        entityCollection: '[entita]'  // Nome collection della tua entita
    });
    // ... resto del codice
}

// Quando salvi una nuova entita
if (isNew) {
    const createApi = httpsCallable(functions, 'create[Entita]Api');
    const result = await createApi(payloadToSend);
    const id = result.data?.id;
    if (id) {
        currentEntityId = id;
        showTabsForExistingEntity();
        attachmentUtils.listenForAttachments(id);
        actionUtils.loadActions(id);
        commentUtils.listenForComments(id);  // ✅ Attiva gestione comments
    }
}

// Quando modifichi un'entita esistente
const editEntity = async (id) => {
    currentEntityId = id;
    // ... carica dati entita
    showTabsForExistingEntity();
    attachmentUtils.listenForAttachments(id);
    actionUtils.loadActions(id);
    commentUtils.listenForComments(id);  // ✅ Carica comments esistenti
    openSidebar();
};
```

#### PASSO 3: Nascondi Tab per Nuove Entita

Le nuove entita non hanno ancora un ID, quindi nascondi il tab note insieme agli altri:

```javascript
function hideTabsForNewEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="note"], [data-tab="azioni"]')
        .forEach(t => t.style.display = 'none');
    document.querySelectorAll('#tab-attachments, #tab-note, #tab-azioni')
        .forEach(t => t.style.display = 'none');
}

function showTabsForExistingEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="note"], [data-tab="azioni"]')
        .forEach(t => t.style.display = '');
    document.querySelectorAll('#tab-attachments, #tab-note, #tab-azioni')
        .forEach(t => t.style.display = '');
}
```

### 🔍 Query Firestore per Comments

Firestore viene interrogato automaticamente da `commentUtils` con:

```javascript
query(
    collection(db, 'comments'),
    where("entityId", "==", entityId),
    where("entityCollection", "==", entityCollection),
    orderBy("created", "desc")
)
```

**IMPORTANTE:** Richiede composite index in `firestore.indexes.json`:

```json
{
  "collectionGroup": "comments",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "entityId", "order": "ASCENDING"},
    {"fieldPath": "entityCollection", "order": "ASCENDING"},
    {"fieldPath": "created", "order": "DESCENDING"}
  ]
}
```

### 📋 Firestore Security Rules

Le regole sono già configurate in `firestore.rules`:

```javascript
match /comments/{commentId} {
  // Lettura permessa a tutti gli utenti autenticati
  allow read: if request.auth != null;

  // Scrittura NON permessa ai client - solo tramite Cloud Functions
  allow write: if false;
}
```

### 🎯 API Backend (Già Implementate)

Le Cloud Functions per comments sono in `functions/api/comments.ts`:

1. **createCommentApi** - Crea nuovo commento
   - Permessi: Tutti gli utenti autenticati
   - Input: `{ text, entityId, entityCollection }`
   - Audit log salvato su parent entity

2. **getEntityCommentsApi** - Recupera commenti di un'entita
   - Permessi: Tutti gli utenti autenticati
   - Input: `{ entityId, entityCollection }`

3. **deleteCommentApi** - Elimina commento
   - Permessi: Admin o creatore del commento
   - Input: `{ commentId }`
   - Audit log salvato su parent entity

### ✅ Esempio Completo: Prodotti

Copia questo pattern per aggiungere comments ai prodotti:

```javascript
// src/scripts/prodotti.ts

import { storage, auth, functions } from '../lib/firebase-client';
import { doc, getFirestore } from "firebase/firestore";
import * as attachmentUtils from './utils/attachmentUtils.ts';
import * as actionUtils from './utils/actionUtils.ts';
import * as commentUtils from './utils/commentUtils.ts';
import { httpsCallable } from "firebase/functions";

let currentEntityId = null;

export function initProdottiPage() {
    const db = getFirestore();

    // ✅ Setup utilities con entityCollection
    attachmentUtils.setup({
        db,
        storage,
        auth,
        functions,
        entityCollection: 'prodotti'
    });

    actionUtils.setup({ db, auth, functions, entityCollection: 'prodotti' });

    commentUtils.setup({
        db,
        auth,
        functions,
        entityCollection: 'prodotti'
    });

    setupEventListeners();
    // Lista gestita da store realtime (no loadEntities)
}

async function saveEntity(e) {
    e.preventDefault();
    const isNew = !currentEntityId;

    // ... raccolta dati ...

    if (isNew) {
        const createApi = httpsCallable(functions, 'createProdottoApi');
        const result = await createApi(payloadToSend);
        const id = result.data?.id;
        if (id) {
            currentEntityId = id;
            document.getElementById('entity-id').value = id;
            showTabsForExistingEntity();

            // ✅ Attiva gestione attachments e comments
            attachmentUtils.listenForAttachments(id);
            actionUtils.loadActions(id);
            commentUtils.listenForComments(id);
        }
    } else {
        // ... update ...
    }
}

const editEntity = async (id) => {
    currentEntityId = id;
    // ... carica dati prodotto ...

    showTabsForExistingEntity();

    // ✅ Carica attachments e comments associati
    attachmentUtils.listenForAttachments(id);
    actionUtils.loadActions(id);
    commentUtils.listenForComments(id);

    openSidebar();
};

function hideTabsForNewEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="note"], [data-tab="azioni"]')
        .forEach(t => t.style.display = 'none');
    document.querySelectorAll('#tab-attachments, #tab-note, #tab-azioni')
        .forEach(t => t.style.display = 'none');
}

function showTabsForExistingEntity() {
    document.querySelectorAll('[data-tab="attachments"], [data-tab="note"], [data-tab="azioni"]')
        .forEach(t => t.style.display = '');
    document.querySelectorAll('#tab-attachments, #tab-note, #tab-azioni')
        .forEach(t => t.style.display = '');
}
```

### 🚀 Vantaggi di Questo Approccio

✅ **Riutilizzabile:** Stesso codice per tutte le entita
✅ **Zero backend:** API comments già pronte
✅ **Audit automatico:** Ogni commento tracciato su parent entity
✅ **Realtime:** Listener Firestore per aggiornamenti live
✅ **Query efficienti:** Composite index su `entityId` + `entityCollection`
✅ **Permessi granulari:** Admin o creatore possono eliminare

### 📝 Note Importanti

1. **Non creare nuove API comments** - Usa quelle esistenti (`createCommentApi`, `deleteCommentApi`)
2. **entityCollection deve corrispondere** - Deve essere lo stesso nome usato per audit e collection
3. **Tab sempre nascosto per nuove entita** - I commenti richiedono un ID salvato
4. **Audit logs su parent** - I log appaiono nella timeline dell'entita associata
5. **Realtime updates** - Usa `onSnapshot` per visualizzazione live dei commenti

### 🔧 Componenti HTML Necessari

Il tab note richiede questi elementi HTML:

```html
<div id="tab-note" class="tab-content">
    <!-- Form per aggiungere nota -->
    <div class="form-group">
        <label for="comment-text">Aggiungi una nota</label>
        <textarea id="comment-text" rows="4" placeholder="Scrivi una nota..."></textarea>
    </div>
    <div class="form-group">
        <button type="button" id="save-comment-btn" class="btn btn-small">Salva Nota</button>
    </div>

    <!-- Container nascosto per compatibilità -->
    <div id="comment-form" style="display: none;"></div>

    <!-- Lista commenti (popolata dinamicamente) -->
    <div id="comment-list"></div>
</div>
```

### 📊 Factory Function (Già Implementata)

La factory per comments è in `shared/schemas/entityFactory.ts`:

```javascript
export function createComment({
  text,
  entityId,
  entityCollection,
  lastModifiedBy = null,
  lastModifiedByEmail = null
} = {}) {
  if (!text || !entityId || !entityCollection) {
    throw new Error('text, entityId e entityCollection sono obbligatori');
  }

  const timestamp = nowIso();

  return {
    text: String(text),
    entityId: String(entityId),
    entityCollection: String(entityCollection),
    created: timestamp,
    lastModifiedBy: lastModifiedBy ? String(lastModifiedBy) : null,
    lastModifiedByEmail: lastModifiedByEmail ? String(lastModifiedByEmail) : null
  };
}
```

---

## ✅ Best Practices

1. **Sempre usa Factory:** Non creare oggetti manualmente, usa `create[Entity]()`
2. **Validazione sia client che server:** Non fidarti mai del client
3. **Audit fields:** Sempre `lastModifiedBy`, `created`, `changed`
4. **Timestamp ISO:** Usa `.toISOString()` per consistenza
5. **Firestore Timestamp solo per changed:** Nelle update usa `FieldValue.serverTimestamp()`
6. **Test per ogni operazione:** Almeno 4 test (create, update, delete, permessi)
7. **Log strutturati:** Sempre `console.log("Utente X ha fatto Y")`
8. **Error handling:** Try-catch con HttpsError specifici
9. **Attachments sempre associati:** Usa `attachmentUtils.setup()` con `entityCollection` corretta
10. **Storage path unico:** Ogni entita ha la sua cartella `attachments/[entityId]/`

---

## 📚 Prossimi Passi

Per aggiungere una nuova entita:
1. Copia questo pattern
2. Sostituisci `[entita]` e `[EntityName]` con il nome della tua entita
3. Definisci i campi specifici
4. Implementa i test
5. Esegui `npm test` per verificare

**Tempo stimato per nuova entita:** 2-3 ore seguendo questi pattern.
