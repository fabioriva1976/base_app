# 📐 Pattern e Convenzioni - Template Base App

**Versione:** 1.0
**Data:** 2026-01-08
**Obiettivo:** Documentazione per AI - Pattern replicabili per nuove entità

---

## 🎯 Come Usare Questo Attachment

Questo attachment definisce i **pattern standard** per creare nuove entità (es: prodotti, fornitori, ordini).
Ogni nuova entità DEVE seguire questi pattern per garantire:
- ✅ Coerenza del codice
- ✅ Facilità di manutenzione
- ✅ Replicabilità da parte di AI
- ✅ Testing automatico

---

## 📋 Checklist per Nuova Entità

Quando crei una nuova entità (es: `prodotti`), devi creare questi file:

### 1. Schema e Factory
- [ ] `shared/schemas/entityFactory.js` - Aggiungi funzione `createProdotto()`

### 2. API Backend
- [ ] `functions/api/prodotti.js` - CRUD completo (Create, Read, Update, Delete, List)

### 3. Test
- [ ] `functions/prodotti.test.js` - Test per tutte le operazioni CRUD

### 4. Frontend
- [ ] `src/pages/anagrafica-prodotti.astro` - Pagina lista/gestione
- [ ] `src/scripts/anagrafica-prodotti.js` - Logica frontend

### 5. Firestore Rules
- [ ] `firestore.rules` - Aggiungi regole per collection `anagrafica_prodotti`

---

## 📚 Entità Template Esistenti

Il progetto include 3 entità completamente documentate che puoi usare come template:

### 1. **Clienti** (CRUD Standard)
File di riferimento più completo per entità con CRUD classico.

- 📄 **API**: [functions/api/clienti.js](functions/api/clienti.js)
- 🏗️ **Factory**: [shared/schemas/entityFactory.js](shared/schemas/entityFactory.js) - `createCliente()`
- 🧪 **Test**: [functions/clienti.test.js](functions/clienti.test.js)
- 🗄️ **Collection**: `anagrafica_clienti`
- 👥 **Permessi**: Admin per CUD, Operatore+ per R

**Quando usare come template:**
- Entità con campi semplici (stringhe, numeri, booleani)
- CRUD standard senza logiche complesse
- Esempi: prodotti, fornitori, categorie, tag

### 2. **Users** (Firebase Auth + Firestore)
Template per entità che usano Firebase Authentication.

- 📄 **API**: [functions/api/users.js](functions/api/users.js)
- 🏗️ **Factory**: [shared/schemas/entityFactory.js](shared/schemas/entityFactory.js) - `createUtente()`
- 🧪 **Test**: [functions/users.test.js](functions/users.test.js)
- 🗄️ **Collection**: `utenti` + Firebase Auth
- 👥 **Permessi**: Admin only, con controllo gerarchico ruoli

**Quando usare come template:**
- Entità che richiedono autenticazione
- Gestione ruoli e permessi granulari
- Sincronizzazione tra Firebase Auth e Firestore

**Note speciali:**
- Gestisce duplicati email (sync invece di errore)
- Verifica gerarchica permessi (admin non può eliminare superuser)
- Dual-storage (Auth per login, Firestore per metadati)

### 3. **Attachments** (Firestore + Storage)
Template per entità che gestiscono file.

- 📄 **API**: [functions/api/attachments.js](functions/api/attachments.js)
- 🏗️ **Factory**: [shared/schemas/entityFactory.js](shared/schemas/entityFactory.js) - `createAttachment()`
- 🗄️ **Collection**: `attachments`
- 💾 **Storage**: Firebase Storage bucket
- 👥 **Permessi**: Authenticated per C, Admin per UD

**Quando usare come template:**
- Entità con file allegati (PDF, immagini, etc.)
- Gestione upload/download
- Metadata + file binario

**Note speciali:**
- Delete elimina sia record Firestore che file Storage
- Gestione orphaned files (file senza record)
- Validazione MIME type e storage path

---

## 🏗️ PATTERN 1: Schema Entity Factory

**File:** `shared/schemas/entityFactory.js`

### Template Base:

```javascript
/**
 * 🎯 PATTERN: Entity Factory Function
 *
 * Crea un oggetto [ENTITY_NAME] validato e strutturato.
 * Usato sia lato client che server per garantire consistenza.
 *
 * @param {Object} params - Parametri dell'entità
 * @param {string} params.[CAMPO_OBBLIGATORIO] - Descrizione campo
 * @param {string} [params.[CAMPO_OPZIONALE]] - Descrizione campo opzionale
 * @param {string} [params.createdBy] - UID utente che crea l'entità
 * @param {string} [params.createdByEmail] - Email utente che crea l'entità
 * @returns {Object} Oggetto [ENTITY_NAME] validato
 * @throws {Error} Se campi obbligatori mancanti
 */
export function create[EntityName]({
  // CAMPI OBBLIGATORI
  [campo_obbligatorio],

  // CAMPI OPZIONALI (con default)
  [campo_opzionale] = null,
  stato = true,

  // CAMPI AUDIT (sempre presenti)
  createdBy = null,
  createdByEmail = null
} = {}) {
  // 1. VALIDAZIONE: Verifica campi obbligatori
  if (![campo_obbligatorio]) {
    throw new Error('[campo_obbligatorio] è obbligatorio');
  }

  // 2. TIMESTAMP: Genera timestamp ISO
  const timestamp = new Date().toISOString();

  // 3. RETURN: Oggetto validato con tutti i campi tipizzati
  return {
    // Campi obbligatori
    [campo_obbligatorio]: String([campo_obbligatorio]),

    // Campi opzionali (normalizzati)
    [campo_opzionale]: [campo_opzionale] ? String([campo_opzionale]) : null,
    stato: Boolean(stato),

    // Campi audit (sempre presenti)
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: createdBy ? String(createdBy) : null,
    createdByEmail: createdByEmail ? String(createdByEmail).toLowerCase() : null
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
  stato = true,
  createdBy = null,
  createdByEmail = null
} = {}) {
  if (!ragione_sociale) {
    throw new Error('ragione_sociale è obbligatorio');
  }

  const timestamp = new Date().toISOString();

  return {
    ragione_sociale: String(ragione_sociale),
    email: email ? String(email).toLowerCase() : null,
    telefono: telefono ? String(telefono) : null,
    partita_iva: partita_iva ? String(partita_iva) : null,
    stato: Boolean(stato),
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: createdBy ? String(createdBy) : null,
    createdByEmail: createdByEmail ? String(createdByEmail).toLowerCase() : null
  };
}
```

---

## 🔌 PATTERN 2: API Backend CRUD

**File:** `functions/api/[entita].js`

### Struttura Standard:

```javascript
/**
 * 🎯 PATTERN: API CRUD per [ENTITY_NAME]
 *
 * Operazioni disponibili:
 * - CREATE: Crea nuova entità (solo admin)
 * - READ: Ottieni entità per ID (operatore+)
 * - UPDATE: Aggiorna entità esistente (admin)
 * - DELETE: Elimina entità (admin)
 * - LIST: Lista tutte le entità (operatore+)
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { requireAdmin, requireOperator } from "../utils/authHelpers.js";
import { create[EntityName] } from "../../shared/schemas/entityFactory.js";
import { region, corsOrigins } from "../config.js";
import { logAudit, AuditAction } from "../utils/auditLogger.js";

// Inizializza Firebase Admin
if (getApps().length === 0) {
    initializeApp();
}
const db = getFirestore();

// Nome collection Firestore
const COLLECTION_NAME = 'anagrafica_[entita]';

/**
 * 🎯 STEP 1: Validazione Dati
 *
 * Valida i dati prima di salvarli in Firestore.
 * Lancia HttpsError se i dati non sono validi.
 */
function validate[EntityName]Data(data) {
    if (!data.[campo_obbligatorio] || typeof data.[campo_obbligatorio] !== 'string') {
        throw new HttpsError('invalid-argument', '[Campo obbligatorio] è obbligatorio.');
    }

    // Validazioni aggiuntive (email, numeri, etc.)
    if (data.email && !data.email.includes('@')) {
        throw new HttpsError('invalid-argument', 'Email non valida.');
    }
}

/**
 * 🎯 CREATE: Crea nuova entità
 *
 * Permessi: Solo ADMIN
 * Input: { ...campi entità }
 * Output: { id, ...dati entità }
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
        // 2. VALIDAZIONE: Controlla dati
        validate[EntityName]Data(data);

        // 3. BUSINESS LOGIC: Crea oggetto con factory
        const nuovo[EntityName] = create[EntityName]({
            ...data,
            createdBy: uid,
            createdByEmail: token.email,
        });

        // 4. DATABASE: Salva in Firestore
        const docRef = await db.collection(COLLECTION_NAME).add(nuovo[EntityName]);

        // 5. AUDIT LOG: Registra azione per tracciabilità (chi, cosa, quando)
        await logAudit({
            entityType: '[entita]',  // es: 'clienti', 'utenti', 'attachments'
            entityId: docRef.id,
            action: AuditAction.CREATE,
            userId: uid,
            userEmail: token.email,
            newData: nuovo[EntityName],
            source: 'web'
        });

        console.log(`Utente ${uid} ha creato [entità] ${docRef.id}`);

        return { id: docRef.id, ...nuovo[EntityName] };

    } catch (error) {
        console.error("Errore durante la creazione:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile creare [entità].');
    }
});

/**
 * 🎯 UPDATE: Aggiorna entità esistente
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
        throw new HttpsError('invalid-argument', 'ID [entità] è obbligatorio.');
    }

    try {
        validate[EntityName]Data(updateData);

        const docRef = db.collection(COLLECTION_NAME).doc(id);

        // Recupera dati attuali per l'audit log (before/after comparison)
        const oldDoc = await docRef.get();
        const oldData = oldDoc.exists ? oldDoc.data() : null;

        // Aggiunge timestamp aggiornamento
        const dataToUpdate = {
            ...updateData,
            updatedAt: FieldValue.serverTimestamp(),
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

        console.log(`Utente ${uid} ha aggiornato [entità] ${id}`);

        return { message: "[Entità] aggiornato con successo." };

    } catch (error) {
        console.error("Errore durante l'aggiornamento:", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'Impossibile aggiornare [entità].');
    }
});

/**
 * 🎯 DELETE: Elimina entità
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
        throw new HttpsError('invalid-argument', 'ID [entità] è obbligatorio.');
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

        console.log(`Utente ${uid} ha eliminato [entità] ${id}`);

        return { message: "[Entità] eliminato con successo." };

    } catch (error) {
        console.error("Errore durante l'eliminazione:", error);
        throw new HttpsError('internal', 'Impossibile eliminare [entità].');
    }
});

/**
 * 🎯 LIST: Ottieni lista entità
 *
 * Permessi: OPERATORE o superiore
 * Input: {} (opzionale: filtri)
 * Output: [{ id, ...dati }]
 */
export const [entita]ListApi = onCall({
    region: region,
    cors: corsOrigins
}, async (request) => {
    await requireOperator(request);

    const { uid } = request.auth;

    try {
        const snapshot = await db.collection(COLLECTION_NAME)
            .where('stato', '==', true)
            .orderBy('createdAt', 'desc')
            .get();

        const lista = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log(`Utente ${uid} ha listato ${lista.length} [entità]`);

        return lista;

    } catch (error) {
        console.error("Errore durante il recupero lista:", error);
        throw new HttpsError('internal', 'Impossibile recuperare lista [entità].');
    }
});
```

---

## 🧪 PATTERN 3: Test Automatici

**File:** `functions/[entita].test.js`

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
 * - LIST
 * - Controllo permessi (admin/operatore)
 */

import { expect } from 'chai';
import * as test from 'firebase-functions-test';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import {
    [entita]CreateApi,
    [entita]UpdateApi,
    [entita]DeleteApi,
    [entita]ListApi
} from './api/[entita].js';

const testEnv = test({
    projectId: 'base-app-12108'
});

const db = getFirestore();
const auth = getAuth();

describe('API [EntityName]', () => {
    afterEach(async () => {
        // Pulizia: elimina attachments di test
        const snapshot = await db.collection('anagrafica_[entita]')
            .where('createdBy', 'in', ['admin-test', 'operatore-test'])
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
    it('dovrebbe creare [entità] con dati validi', async () => {
        const wrapped = test.wrap([entita]CreateApi);
        const adminUser = {
            uid: 'admin-test',
            token: { email: 'admin@test.com' }
        };

        // Crea utente admin nel DB
        await db.collection('utenti').doc(adminUser.uid).set({
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

        await db.collection('utenti').doc(adminUser.uid).set({
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
    it('dovrebbe aggiornare [entità] esistente', async () => {
        // Implementazione test update...
    });

    /**
     * TEST DELETE
     */
    it('dovrebbe eliminare [entità]', async () => {
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

        await db.collection('utenti').doc(operatoreUser.uid).set({
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
- `clienteListApi`

**Collection:** `anagrafica_clienti`

### Dopo: Prodotti (Nuovo)

**Factory:**
```javascript
createProdotto({
  nome,           // campo obbligatorio
  codice = null,  // campo opzionale
  prezzo = 0,
  categoria = null,
  stato = true,
  createdBy = null,
  createdByEmail = null
})
```

**API:**
- `prodottoCreateApi`
- `prodottoUpdateApi`
- `prodottoDeleteApi`
- `prodottoListApi`

**Collection:** `anagrafica_prodotti`

---

## 🚀 Convenzioni di Naming

### Camel Case vs Snake Case

- **Frontend/JS:** `camelCase` → `ragioneSociale`
- **Firestore/DB:** `snake_case` → `ragione_sociale`
- **Funzioni:** `camelCase` → `createCliente()`
- **API Export:** `camelCase` → `clienteCreateApi`
- **Collections:** `snake_case` → `anagrafica_clienti`

### Nomi File

- **API:** `functions/api/[entita].js` (plurale)
- **Test:** `functions/[entita].test.js` (plurale)
- **Frontend:** `src/scripts/anagrafica-[entita].js` (singolare con trattino)
- **Pagina:** `src/pages/anagrafica-[entita].astro`

---

## 📎 Associare Attachments alle Entità

Il sistema di gestione attachments è **già predisposto** per funzionare con qualsiasi entità. Non devi creare nuove API o backend, ma solo collegare il componente frontend.

### 🎯 Come Funziona

I attachments sono salvati in una **collection centrale** (`attachments`) con metadata che puntano all'entità associata:

```javascript
{
  nome: "fattura.pdf",
  tipo: "application/pdf",
  storagePath: "attachments/ABC123/1234567890_fattura.pdf",
  metadata: {
    entityId: "ABC123",              // ID dell'entità (cliente, prodotto, etc.)
    entityCollection: "anagrafica_clienti",  // Nome collection
    url: "https://...",
    size: 123456,
    description: "Fattura 2024"
  },
  createdBy: "user123",
  createdByEmail: "user@example.com",
  createdAt: Timestamp
}
```

### ✅ 3 Passi per Aggiungere Attachments a una Nuova Entità

#### PASSO 1: Aggiungi Tab Attachments alla Pagina Astro

Nel file `src/pages/anagrafica-[entita].astro`, aggiungi il tab attachments nella sidebar:

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

Nel file `src/scripts/anagrafica-[entita].js`:

```javascript
// Import
import * as attachmentUtils from './utils/attachmentUtils.js';

// Setup (nella funzione init)
export function initPageAnagrafica[Entita]Page() {
    const db = getFirestore();
    attachmentUtils.setup({
        db,
        storage,
        auth,
        functions,
        entityCollection: 'anagrafica_[entita]'  // Nome collection della tua entità
    });
    // ... resto del codice
}

// Quando salvi una nuova entità
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

// Quando modifichi un'entità esistente
const editEntity = async (id) => {
    currentEntityId = id;
    // ... carica dati entità
    showTabsForExistingEntity();
    attachmentUtils.listenForAttachments(id);  // ✅ Carica attachments esistenti
    actionUtils.loadActions(id);
    openSidebar();
};
```

#### PASSO 3: Nascondi Tab per Nuove Entità

Le nuove entità non hanno ancora un ID, quindi nascondi il tab attachments:

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
    orderBy("createdAt", "desc")
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
// src/scripts/anagrafica-prodotti.js

import { storage, auth, functions } from '../lib/firebase-client';
import { doc, getFirestore } from "firebase/firestore";
import * as attachmentUtils from './utils/attachmentUtils.js';
import * as actionUtils from './utils/actionUtils.js';
import { httpsCallable } from "firebase/functions";

let currentEntityId = null;

export function initPageAnagraficaProdottiPage() {
    const db = getFirestore();

    // ✅ Setup DocumentUtils con entityCollection
    attachmentUtils.setup({
        db,
        storage,
        auth,
        functions,
        entityCollection: 'anagrafica_prodotti'
    });

    actionUtils.setup({ db, auth, functions, entityCollection: 'anagrafica_prodotti' });
    setupEventListeners();
    loadEntities();
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

✅ **Riutilizzabile:** Stesso codice per tutte le entità
✅ **Zero backend:** API attachments già pronte
✅ **Audit automatico:** Ogni upload tracciato
✅ **Storage organizzato:** File separati per entità
✅ **Query efficienti:** Index su `metadata.entityId`

### 📝 Note Importanti

1. **Non creare nuove API attachments** - Usa quelle esistenti (`createAttachmentRecordApi`, `deleteAttachmentApi`)
2. **entityCollection deve corrispondere** - Deve essere lo stesso nome usato per audit e collection
3. **Tab sempre nascosto per nuove entità** - Gli upload richiedono un ID salvato
4. **Cleanup automatico Storage** - L'eliminazione del attachment rimuove anche il file fisico

---

## 💬 Associare Comments alle Entità

Il sistema di gestione comments è **già predisposto** per funzionare con qualsiasi entità, esattamente come gli attachments. Non devi creare nuove API o backend, ma solo collegare il componente frontend.

### 🎯 Come Funziona

I comments sono salvati in una **collection centrale** (`comments`) con metadata che puntano all'entità associata:

```javascript
{
  text: "Contattare il cliente per preventivo 2024",
  entityId: "ABC123",              // ID dell'entità (cliente, prodotto, etc.)
  entityCollection: "anagrafica_clienti",  // Nome collection
  createdBy: "user123",
  createdByEmail: "user@example.com",
  createdAt: "2026-01-09T10:30:00.000Z"
}
```

### 🔄 Differenze tra Comments e Attachments

| Feature | Attachments | Comments |
|---------|-------------|----------|
| **Storage** | Firestore + Storage | Solo Firestore |
| **Struttura** | `metadata.entityId` | `entityId` diretto |
| **Query Index** | `metadata.entityId` + `createdAt` | `entityId` + `entityCollection` + `createdAt` |
| **Permessi Delete** | Solo admin | Admin o creatore |
| **Audit Log** | Salvato su parent entity | Salvato su parent entity |

### ✅ 3 Passi per Aggiungere Comments a una Nuova Entità

#### PASSO 1: Aggiungi Tab Note alla Pagina Astro

Nel file `src/pages/anagrafica-[entita].astro`, aggiungi il tab note nella sidebar:

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

Nel file `src/scripts/anagrafica-[entita].js`:

```javascript
// Import
import * as commentUtils from './utils/commentUtils.js';

// Setup (nella funzione init)
export function initPageAnagrafica[Entita]Page() {
    const db = getFirestore();
    commentUtils.setup({
        db,
        auth,
        functions,
        entityCollection: 'anagrafica_[entita]'  // Nome collection della tua entità
    });
    // ... resto del codice
}

// Quando salvi una nuova entità
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

// Quando modifichi un'entità esistente
const editEntity = async (id) => {
    currentEntityId = id;
    // ... carica dati entità
    showTabsForExistingEntity();
    attachmentUtils.listenForAttachments(id);
    actionUtils.loadActions(id);
    commentUtils.listenForComments(id);  // ✅ Carica comments esistenti
    openSidebar();
};
```

#### PASSO 3: Nascondi Tab per Nuove Entità

Le nuove entità non hanno ancora un ID, quindi nascondi il tab note insieme agli altri:

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
    orderBy("createdAt", "desc")
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
    {"fieldPath": "createdAt", "order": "DESCENDING"}
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

Le Cloud Functions per comments sono in `functions/api/comments.js`:

1. **createCommentApi** - Crea nuovo commento
   - Permessi: Tutti gli utenti autenticati
   - Input: `{ text, entityId, entityCollection }`
   - Audit log salvato su parent entity

2. **getEntityCommentsApi** - Recupera commenti di un'entità
   - Permessi: Tutti gli utenti autenticati
   - Input: `{ entityId, entityCollection }`

3. **deleteCommentApi** - Elimina commento
   - Permessi: Admin o creatore del commento
   - Input: `{ commentId }`
   - Audit log salvato su parent entity

### ✅ Esempio Completo: Prodotti

Copia questo pattern per aggiungere comments ai prodotti:

```javascript
// src/scripts/anagrafica-prodotti.js

import { storage, auth, functions } from '../lib/firebase-client';
import { doc, getFirestore } from "firebase/firestore";
import * as attachmentUtils from './utils/attachmentUtils.js';
import * as actionUtils from './utils/actionUtils.js';
import * as commentUtils from './utils/commentUtils.js';
import { httpsCallable } from "firebase/functions";

let currentEntityId = null;

export function initPageAnagraficaProdottiPage() {
    const db = getFirestore();

    // ✅ Setup utilities con entityCollection
    attachmentUtils.setup({
        db,
        storage,
        auth,
        functions,
        entityCollection: 'anagrafica_prodotti'
    });

    actionUtils.setup({ db, auth, functions, entityCollection: 'anagrafica_prodotti' });

    commentUtils.setup({
        db,
        auth,
        functions,
        entityCollection: 'anagrafica_prodotti'
    });

    setupEventListeners();
    loadEntities();
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

✅ **Riutilizzabile:** Stesso codice per tutte le entità
✅ **Zero backend:** API comments già pronte
✅ **Audit automatico:** Ogni commento tracciato su parent entity
✅ **Real-time:** Listener Firestore per aggiornamenti live
✅ **Query efficienti:** Composite index su `entityId` + `entityCollection`
✅ **Permessi granulari:** Admin o creatore possono eliminare

### 📝 Note Importanti

1. **Non creare nuove API comments** - Usa quelle esistenti (`createCommentApi`, `deleteCommentApi`)
2. **entityCollection deve corrispondere** - Deve essere lo stesso nome usato per audit e collection
3. **Tab sempre nascosto per nuove entità** - I commenti richiedono un ID salvato
4. **Audit logs su parent** - I log appaiono nella timeline dell'entità associata
5. **Real-time updates** - Usa `onSnapshot` per visualizzazione live dei commenti

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

La factory per comments è in `shared/schemas/entityFactory.js`:

```javascript
export function createComment({
  text,
  entityId,
  entityCollection,
  createdBy = null,
  createdByEmail = null
} = {}) {
  if (!text || !entityId || !entityCollection) {
    throw new Error('text, entityId e entityCollection sono obbligatori');
  }

  const timestamp = nowIso();

  return {
    text: String(text),
    entityId: String(entityId),
    entityCollection: String(entityCollection),
    createdAt: timestamp,
    createdBy: createdBy ? String(createdBy) : null,
    createdByEmail: createdByEmail ? String(createdByEmail) : null
  };
}
```

---

## ✅ Best Practices

1. **Sempre usa Factory:** Non creare oggetti manualmente, usa `create[Entity]()`
2. **Validazione sia client che server:** Non fidarti mai del client
3. **Audit fields:** Sempre `createdBy`, `createdAt`, `updatedAt`
4. **Timestamp ISO:** Usa `.toISOString()` per consistenza
5. **Firestore Timestamp solo per updatedAt:** Nelle update usa `FieldValue.serverTimestamp()`
6. **Test per ogni operazione:** Almeno 5 test (create, update, delete, list, permessi)
7. **Log strutturati:** Sempre `console.log("Utente X ha fatto Y")`
8. **Error handling:** Try-catch con HttpsError specifici
9. **Attachments sempre associati:** Usa `attachmentUtils.setup()` con `entityCollection` corretta
10. **Storage path unico:** Ogni entità ha la sua cartella `attachments/[entityId]/`

---

## 📚 Prossimi Passi

Per aggiungere una nuova entità:
1. Copia questo pattern
2. Sostituisci `[entita]` e `[EntityName]` con il nome della tua entità
3. Definisci i campi specifici
4. Implementa i test
5. Esegui `npm test` per verificare

**Tempo stimato per nuova entità:** 2-3 ore seguendo questi pattern.
