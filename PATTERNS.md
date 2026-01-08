# 📐 Pattern e Convenzioni - Template Base App

**Versione:** 1.0
**Data:** 2026-01-08
**Obiettivo:** Documentazione per AI - Pattern replicabili per nuove entità

---

## 🎯 Come Usare Questo Documento

Questo documento definisce i **pattern standard** per creare nuove entità (es: prodotti, fornitori, ordini).
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

### 3. **Documenti** (Firestore + Storage)
Template per entità che gestiscono file.

- 📄 **API**: [functions/api/documenti.js](functions/api/documenti.js)
- 🏗️ **Factory**: [shared/schemas/entityFactory.js](shared/schemas/entityFactory.js) - `createDocumento()`
- 🗄️ **Collection**: `documenti`
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
            entityType: '[entita]',  // es: 'clienti', 'utenti', 'documenti'
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
        // Pulizia: elimina documenti di test
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

## ✅ Best Practices

1. **Sempre usa Factory:** Non creare oggetti manualmente, usa `create[Entity]()`
2. **Validazione sia client che server:** Non fidarti mai del client
3. **Audit fields:** Sempre `createdBy`, `createdAt`, `updatedAt`
4. **Timestamp ISO:** Usa `.toISOString()` per consistenza
5. **Firestore Timestamp solo per updatedAt:** Nelle update usa `FieldValue.serverTimestamp()`
6. **Test per ogni operazione:** Almeno 5 test (create, update, delete, list, permessi)
7. **Log strutturati:** Sempre `console.log("Utente X ha fatto Y")`
8. **Error handling:** Try-catch con HttpsError specifici

---

## 📚 Prossimi Passi

Per aggiungere una nuova entità:
1. Copia questo pattern
2. Sostituisci `[entita]` e `[EntityName]` con il nome della tua entità
3. Definisci i campi specifici
4. Implementa i test
5. Esegui `npm test` per verificare

**Tempo stimato per nuova entità:** 2-3 ore seguendo questi pattern.
