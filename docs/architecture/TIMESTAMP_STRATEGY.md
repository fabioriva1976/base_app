# 🕐 Strategia Gestione Timestamp

**Data**: 2026-01-12
**Versione**: 2.0
**Status**: ✅ Implementato

---

## 🎯 Problema Risolto

Prima della standardizzazione, il progetto usava **due strategie diverse** per i timestamp:
- **Factory**: `new Date().toISOString()` (string ISO client-side)
- **API Update**: `FieldValue.serverTimestamp()` (Firestore Timestamp server-side)

Questo creava **inconsistenza** e problemi:
- Timestamp client possono essere manipolati (clock locale errato)
- Formati misti (string vs Timestamp)
- Difficoltà nel filtrare/ordinare

---

## ✅ Soluzione Implementata

### Strategia Unica: Server Timestamp

**Factory → `null` (placeholder)**
```javascript
// shared/schemas/entityFactory.ts
export const SERVER_TIMESTAMP = null;

export function createCliente({...}) {
  return {
    ragione_sociale: String(ragione_sociale),
    ...
    created: SERVER_TIMESTAMP,  // null
    changed: SERVER_TIMESTAMP   // null
  };
}
```

**API → `FieldValue.serverTimestamp()`**
```javascript
// functions/api/clienti.ts
const nuovoCliente = createCliente({...});

// Sostituisce null con server timestamp prima di salvare
nuovoCliente.created = FieldValue.serverTimestamp();
nuovoCliente.changed = FieldValue.serverTimestamp();

await db.collection('clienti').add(nuovoCliente);
```

---

## 🔄 Flusso Completo

### CREATE (Nuova Entità)

```mermaid
Factory (shared)           API Backend (functions)         Firestore
     │                            │                            │
     ├─> createCliente()          │                            │
     │   {                        │                            │
     │     ragione_sociale: "...", │                            │
     │     created: null,         │                            │
     │     changed: null          │                            │
     │   }                        │                            │
     │                            │                            │
     ├──────────────────────────>│                            │
     │                            ├─> created = FieldValue.   │
     │                            │   serverTimestamp()        │
     │                            ├─> changed = FieldValue.   │
     │                            │   serverTimestamp()        │
     │                            │                            │
     │                            ├──────────────────────────>│
     │                            │                            ├─> Salva con
     │                            │                            │   timestamp server
     │                            │                            │   affidabile
```

### UPDATE (Entità Esistente)

```javascript
// API Backend
const dataToUpdate = {
  ...updateData,
  changed: FieldValue.serverTimestamp(),  // Aggiorna solo changed
  lastModifiedBy: uid,
  lastModifiedByEmail: email
};

await db.collection('clienti').doc(id).update(dataToUpdate);
```

**NOTA**: `created` e `createdBy/Email` NON vengono mai modificati dopo la creazione.

---

## 📋 Campi Timestamp Standardizzati

Ogni entità ha **2 campi timestamp**:

| Campo | Tipo | Quando si aggiorna | Immutabile dopo create |
|-------|------|-------------------|------------------------|
| `created` | Firestore Timestamp | Solo CREATE | ✅ Sì |
| `changed` | Firestore Timestamp | CREATE + UPDATE | ❌ No (sempre aggiornato) |

---

## 🏗️ Implementazione nei File

### 1. Factory (shared/schemas/entityFactory.ts)

```javascript
/**
 * 🕐 STRATEGIA TIMESTAMP:
 * - Factory: Ritornano `null` per created/changed
 * - Backend API: Sostituiscono null con FieldValue.serverTimestamp()
 * - Questo garantisce timestamp server-side consistenti e sicuri
 */

export const SERVER_TIMESTAMP = null;

export function createCliente({...}) {
  return {
    ragione_sociale: String(ragione_sociale),
    codice: String(codice),
    // ...altri campi...
    created: SERVER_TIMESTAMP,  // null
    changed: SERVER_TIMESTAMP,  // null
    createdBy: auditFields.createdBy,
    createdByEmail: auditFields.createdByEmail,
    lastModifiedBy: auditFields.lastModifiedBy,
    lastModifiedByEmail: auditFields.lastModifiedByEmail
  };
}
```

### 2. API CREATE (functions/api/*.ts)

```javascript
import { FieldValue } from "firebase-admin/firestore";
import { createCliente } from "../../shared/schemas/entityFactory.ts";

export const createClienteApi = onCall({...}, async (request) => {
  // 1. Crea oggetto con factory
  const nuovoCliente = createCliente({
    ...data,
    createdBy: uid,
    createdByEmail: token.email
  });

  // 2. Sostituisce null con server timestamp
  nuovoCliente.created = FieldValue.serverTimestamp();
  nuovoCliente.changed = FieldValue.serverTimestamp();

  // 3. Salva in Firestore
  const docRef = await db.collection('clienti').add(nuovoCliente);

  return { id: docRef.id, ...nuovoCliente };
});
```

### 3. API UPDATE (functions/api/*.ts)

```javascript
export const updateClienteApi = onCall({...}, async (request) => {
  const { id, ...updateData } = request.data;

  // Aggiorna SOLO changed, non created
  const dataToUpdate = {
    ...updateData,
    changed: FieldValue.serverTimestamp(),
    lastModifiedBy: uid,
    lastModifiedByEmail: token.email
  };

  await db.collection('clienti').doc(id).update(dataToUpdate);
});
```

---

## 🧪 Testing

### Test Unitari (Factory)

```javascript
// tests/unit/entityFactory.test.js
it('dovrebbe creare cliente con timestamp null', () => {
  const cliente = createCliente({
    ragione_sociale: 'Test',
    codice: 'T001'
  });

  // Timestamp sono null (placeholder)
  expect(cliente.created).toBe(null);
  expect(cliente.changed).toBe(null);
});
```

### Test Integrazione (API)

```javascript
// tests/functions/clienti.test.js
it('dovrebbe salvare cliente con server timestamp', async () => {
  const wrapped = test.wrap(createClienteApi);
  const result = await wrapped({
    data: { ragione_sociale: 'Test', codice: 'T001' },
    auth: { uid: 'test-user', token: { email: 'test@example.com' } }
  });

  // Verifica che sia stato salvato in Firestore
  const doc = await db.collection('clienti').doc(result.id).get();
  const data = doc.data();

  // created e changed sono Firestore Timestamp, non null
  expect(data.created).toBeDefined();
  expect(data.changed).toBeDefined();
  expect(typeof data.created.toDate === 'function').toBe(true);
});
```

---

## 🔐 Sicurezza

### Perché Server Timestamp?

**❌ Client Timestamp (toISOString())**:
- Clock locale può essere errato
- Utente può manipolare timestamp
- Fusi orari diversi creano inconsistenza
- Non adatto per audit trail

**✅ Server Timestamp (FieldValue.serverTimestamp())**:
- Timestamp garantito dal server Firestore
- Immutabile e affidabile
- Stesso fuso orario (UTC)
- Perfetto per audit trail
- Supporta query temporali precise

### Firestore Rules

Le rules **non validano** i timestamp (gestiti server-side):

```javascript
// firestore.rules
match /clienti/{clientId} {
  // Lettura: tutti autenticati
  allow read: if request.auth != null;

  // Scrittura: SOLO Cloud Functions
  // Timestamp automatici via FieldValue.serverTimestamp()
  allow write: if false;
}
```

---

## 📊 Query e Ordinamento

### Query per Data

```javascript
// Firestore query - funziona con Timestamp
const recentClienti = await db.collection('clienti')
  .where('created', '>', new Date('2024-01-01'))
  .orderBy('created', 'desc')
  .limit(10)
  .get();
```

### Formattazione Frontend

```javascript
// Frontend - converte Timestamp in Date
import { formatDate } from './utils/formatters.ts';

function renderCliente(cliente) {
  // cliente.created è Firestore Timestamp
  const createdDate = cliente.created.toDate();  // Converte a JS Date
  const formattedDate = formatDate(createdDate); // "12/01/2024 10:30"

  return `
    <td>${cliente.ragione_sociale}</td>
    <td>${formattedDate}</td>
  `;
}
```

---

## 📝 Best Practices

### ✅ DO

1. **Usa sempre SERVER_TIMESTAMP nelle factory**
   ```javascript
   return {
     created: SERVER_TIMESTAMP,
     changed: SERVER_TIMESTAMP
   };
   ```

2. **Sostituisci con FieldValue.serverTimestamp() prima di salvare**
   ```javascript
   nuovoCliente.created = FieldValue.serverTimestamp();
   nuovoCliente.changed = FieldValue.serverTimestamp();
   await db.collection('clienti').add(nuovoCliente);
   ```

3. **Aggiorna solo `changed` negli update**
   ```javascript
   await db.collection('clienti').doc(id).update({
     ...updateData,
     changed: FieldValue.serverTimestamp()
   });
   ```

4. **Non toccare mai `created` dopo la creazione**

5. **Usa .toDate() nel frontend per convertire**
   ```javascript
   const jsDate = firestoreTimestamp.toDate();
   ```

### ❌ DON'T

1. **Non usare `new Date().toISOString()` nelle API**
   ```javascript
   // ❌ SBAGLIATO
   nuovoCliente.created = new Date().toISOString();

   // ✅ CORRETTO
   nuovoCliente.created = FieldValue.serverTimestamp();
   ```

2. **Non modificare `created` negli update**
   ```javascript
   // ❌ SBAGLIATO
   await db.collection('clienti').doc(id).update({
     created: FieldValue.serverTimestamp()  // Mai sovrascrivere!
   });
   ```

3. **Non fare query con string timestamp**
   ```javascript
   // ❌ SBAGLIATO (se timestamp è Firestore Timestamp)
   .where('created', '>', '2024-01-01T00:00:00.000Z')

   // ✅ CORRETTO
   .where('created', '>', new Date('2024-01-01'))
   ```

4. **Non mescolare strategie diverse**
   Usa SEMPRE `FieldValue.serverTimestamp()` per tutti i timestamp.

---

## 🔗 File Correlati

- **Factory**: [shared/schemas/entityFactory.ts](../../shared/schemas/entityFactory.ts)
- **API Clienti**: [functions/api/clienti.ts](../../functions/api/clienti.ts)
- **API Attachments**: [functions/api/attachments.ts](../../functions/api/attachments.ts)
- **API Comments**: [functions/api/comments.ts](../../functions/api/comments.ts)
- **Test Unitari**: [tests/unit/entityFactory.test.js](../../tests/unit/entityFactory.test.js)

---

## 📚 Risorse

- [Firestore Timestamp Documentation](https://firebase.google.com/docs/reference/js/firestore_.timestamp)
- [FieldValue.serverTimestamp()](https://firebase.google.com/docs/reference/js/firestore_.fieldvalue#fieldvalueservertimestamp)
- [Query Data with Timestamps](https://firebase.google.com/docs/firestore/query-data/queries#query_operators)

---

## 🎓 Esempio Completo: Nuova Entità

```javascript
// 1. Factory (shared/schemas/entityFactory.ts)
export function createProdotto({
  nome,
  prezzo,
  createdBy = null,
  createdByEmail = null
}) {
  const auditFields = normalizeAuditFields(createdBy, createdByEmail);

  return {
    nome: String(nome),
    prezzo: Number(prezzo),
    created: SERVER_TIMESTAMP,   // null
    changed: SERVER_TIMESTAMP,   // null
    createdBy: auditFields.createdBy,
    createdByEmail: auditFields.createdByEmail,
    lastModifiedBy: auditFields.lastModifiedBy,
    lastModifiedByEmail: auditFields.lastModifiedByEmail
  };
}

// 2. API CREATE (functions/api/prodotti.ts)
export const createProdottoApi = onCall({...}, async (request) => {
  const nuovoProdotto = createProdotto({
    ...data,
    createdBy: uid,
    createdByEmail: token.email
  });

  // Sostituisce null con server timestamp
  nuovoProdotto.created = FieldValue.serverTimestamp();
  nuovoProdotto.changed = FieldValue.serverTimestamp();

  await db.collection('prodotti').add(nuovoProdotto);
});

// 3. API UPDATE (functions/api/prodotti.ts)
export const updateProdottoApi = onCall({...}, async (request) => {
  const dataToUpdate = {
    ...updateData,
    changed: FieldValue.serverTimestamp(),  // Solo changed
    lastModifiedBy: uid,
    lastModifiedByEmail: token.email
  };

  await db.collection('prodotti').doc(id).update(dataToUpdate);
});
```

---

## ✅ Checklist Implementazione

Per ogni nuova entità:
- [ ] Factory usa `SERVER_TIMESTAMP` per `created` e `changed`
- [ ] API CREATE sostituisce con `FieldValue.serverTimestamp()`
- [ ] API UPDATE aggiorna solo `changed` (non `created`)
- [ ] Test verificano che factory ritorni `null`
- [ ] Firestore rules permettono solo write da Cloud Functions

---

**Data ultimo aggiornamento**: 2026-01-12
**Revisione**: v2.0
**Status**: Implementato e testato
