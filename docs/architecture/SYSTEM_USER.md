# Sistema di Tracking Operazioni di Sistema

## 🎯 Obiettivo

Quando un'entità viene creata o modificata da processi automatici (cron jobs, trigger Firestore, migration scripts) invece che da utenti umani, è fondamentale tracciare questa informazione per:

1. **Audit completo**: Sapere sempre chi ha fatto cosa
2. **Debug**: Identificare operazioni automatiche vs manuali
3. **UI/UX**: Mostrare icone/badge diversi per operazioni di sistema

## 📋 Campi Audit Standardizzati

Tutte le entità hanno ora **4 campi audit obbligatori**:

```javascript
{
  // ... altri campi entità ...

  // Chi ha CREATO l'entità
  createdBy: "user-uid-123" | "SYSTEM",
  createdByEmail: "user@example.com" | "system@internal",

  // Chi ha fatto l'ULTIMA MODIFICA
  lastModifiedBy: "user-uid-456" | "SYSTEM",
  lastModifiedByEmail: "admin@example.com" | "system@internal",

  // Timestamp
  created: "2024-01-12T10:30:00.000Z",
  changed: "2024-01-15T14:20:00.000Z"
}
```

## 🤖 Identificatori Sistema

Quando un'operazione è eseguita dal sistema (non da un utente):

```javascript
// shared/schemas/entityFactory.js
export const SYSTEM_USER = {
  id: 'SYSTEM',
  email: 'system@internal'
};
```

## 🏗️ Uso nelle Factory

### Esempio 1: Creazione da utente (normale)

```javascript
import { createCliente } from '../shared/schemas/entityFactory.js';

const nuovoCliente = createCliente({
  ragione_sociale: 'Acme Corp',
  codice: 'ACM001',
  createdBy: 'user-uid-123',           // UID utente
  createdByEmail: 'admin@example.com'  // Email utente
});

// Risultato:
// {
//   ragione_sociale: 'Acme Corp',
//   codice: 'ACM001',
//   createdBy: 'user-uid-123',
//   createdByEmail: 'admin@example.com',
//   lastModifiedBy: 'user-uid-123',        // Uguale a createdBy
//   lastModifiedByEmail: 'admin@example.com',
//   created: '2024-01-12T10:30:00.000Z',
//   changed: '2024-01-12T10:30:00.000Z'
// }
```

### Esempio 2: Creazione da sistema (automatica)

```javascript
import { createCliente } from '../shared/schemas/entityFactory.js';

// NON passare createdBy/Email → automaticamente SYSTEM
const clienteAutomatico = createCliente({
  ragione_sociale: 'Auto Import Corp',
  codice: 'AUTO001'
  // createdBy: null (default)
  // createdByEmail: null (default)
});

// Risultato:
// {
//   ragione_sociale: 'Auto Import Corp',
//   codice: 'AUTO001',
//   createdBy: 'SYSTEM',
//   createdByEmail: 'system@internal',
//   lastModifiedBy: 'SYSTEM',
//   lastModifiedByEmail: 'system@internal',
//   created: '2024-01-12T10:30:00.000Z',
//   changed: '2024-01-12T10:30:00.000Z'
// }
```

### Esempio 3: Cron Job che importa dati

```javascript
// functions/cron/importClienti.js
import { createCliente } from '../../shared/schemas/entityFactory.js';
import { getFirestore } from 'firebase-admin/firestore';

export const importClientiCron = onSchedule('0 2 * * *', async () => {
  const db = getFirestore();
  const datiEsterniApi = await fetchClientiDaApiEsterna();

  for (const dato of datiEsterniApi) {
    const cliente = createCliente({
      ragione_sociale: dato.nome,
      codice: dato.codice,
      // NON passa createdBy → diventa SYSTEM automaticamente
    });

    await db.collection('anagrafica_clienti').add(cliente);
    console.log(`Cliente ${cliente.codice} importato automaticamente`);
  }
});
```

## 🎨 Visualizzazione nel Frontend

### Helper Utilities

File: [src/scripts/utils/systemUserHelper.js](../../src/scripts/utils/systemUserHelper.js)

```javascript
import {
  isSystemCreated,
  isSystemModified,
  getCreatorDisplayName,
  getModifierDisplayName,
  getAuditInfo
} from './utils/systemUserHelper.js';

// Verifica se entità creata dal sistema
if (isSystemCreated(cliente)) {
  console.log('Cliente importato automaticamente');
}

// Ottieni nome formattato
const createdBy = getCreatorDisplayName(cliente);
// Output: "🤖 Sistema Automatico" o "admin@example.com"

// Ottieni info complete
const audit = getAuditInfo(cliente);
console.log(audit.createdBy);    // "🤖 Sistema Automatico"
console.log(audit.modifiedBy);   // "admin@example.com"
console.log(audit.creatorClass); // "system-created"
```

### Esempio UI: Tabella Clienti

```html
<table>
  <thead>
    <tr>
      <th>Ragione Sociale</th>
      <th>Codice</th>
      <th>Creato da</th>
      <th>Ultimo aggiornamento</th>
    </tr>
  </thead>
  <tbody id="clienti-list">
    <!-- Popolato dinamicamente -->
  </tbody>
</table>

<script type="module">
import { getAuditInfo } from './utils/systemUserHelper.js';

function renderCliente(cliente) {
  const audit = getAuditInfo(cliente);

  return `
    <tr>
      <td>${cliente.ragione_sociale}</td>
      <td>${cliente.codice}</td>
      <td class="${audit.creatorClass}">
        ${audit.createdBy}
        ${audit.isSystemCreated ? '<span class="badge">Auto</span>' : ''}
      </td>
      <td class="${audit.modifierClass}">
        ${audit.modifiedBy}
        <small>${formatDate(cliente.changed)}</small>
      </td>
    </tr>
  `;
}
</script>
```

### Styling CSS

```css
/* Stile per entità create dal sistema */
.system-created {
  color: #6366f1; /* Indigo */
  font-style: italic;
}

.system-modified {
  color: #6366f1;
  font-style: italic;
}

/* Badge per operazioni automatiche */
.badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.75rem;
  background: #e0e7ff;
  color: #4338ca;
  border-radius: 4px;
  margin-left: 4px;
}
```

## 🔄 Aggiornamenti (Update)

Quando aggiorni un'entità, **lastModifiedBy/Email** devono cambiare, ma **createdBy/Email** rimangono immutabili:

```javascript
// functions/api/clienti.js - updateClienteApi
const dataToUpdate = {
  ...updateData,
  changed: new Date().toISOString(),
  lastModifiedBy: uid,                    // Nuovo modificatore
  lastModifiedByEmail: token.email        // Nuova email
  // createdBy e createdByEmail NON vengono toccati
};

await clienteRef.update(dataToUpdate);
```

## 📊 Query e Filtri

### Trovare entità create dal sistema

```javascript
// Firestore query
const systemCreatedSnapshot = await db.collection('anagrafica_clienti')
  .where('createdBy', '==', 'SYSTEM')
  .get();

console.log(`${systemCreatedSnapshot.size} clienti importati automaticamente`);
```

### Trovare entità modificate dal sistema

```javascript
const systemModifiedSnapshot = await db.collection('anagrafica_clienti')
  .where('lastModifiedBy', '==', 'SYSTEM')
  .get();
```

### Firestore Index Richiesto

Se fai query su questi campi, assicurati di avere gli indici in `firestore.indexes.json`:

```json
{
  "collectionGroup": "anagrafica_clienti",
  "queryScope": "COLLECTION",
  "fields": [
    {"fieldPath": "createdBy", "order": "ASCENDING"},
    {"fieldPath": "created", "order": "DESCENDING"}
  ]
}
```

## 🧪 Testing

### Test Factory con SYSTEM

```javascript
// tests/unit/entityFactory.test.js
import { createCliente, SYSTEM_USER } from '../../shared/schemas/entityFactory.js';

it('dovrebbe creare cliente con SYSTEM quando createdBy è null', () => {
  const cliente = createCliente({
    ragione_sociale: 'Test Cliente',
    codice: 'TST001'
    // createdBy: null (default)
  });

  expect(cliente.createdBy).to.equal(SYSTEM_USER.id);
  expect(cliente.createdByEmail).to.equal(SYSTEM_USER.email);
  expect(cliente.lastModifiedBy).to.equal(SYSTEM_USER.id);
  expect(cliente.lastModifiedByEmail).to.equal(SYSTEM_USER.email);
});
```

### Test API con utente

```javascript
// tests/functions/clienti.test.js
it('dovrebbe salvare createdBy quando utente crea cliente', async () => {
  const wrapped = test.wrap(createClienteApi);
  const user = { uid: 'admin-test', token: { email: 'admin@test.com' } };

  await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

  const result = await wrapped({
    data: { ragione_sociale: 'Test', codice: 'T001' },
    auth: user
  });

  const doc = await db.collection('anagrafica_clienti').doc(result.id).get();
  expect(doc.data().createdBy).to.equal('admin-test');
  expect(doc.data().createdByEmail).to.equal('admin@test.com');
  expect(doc.data().lastModifiedBy).to.equal('admin-test');
  expect(doc.data().lastModifiedByEmail).to.equal('admin@test.com');
});
```

## 📝 Best Practices

### ✅ DO

1. **Sempre usa le factory** per creare entità
2. **Non passare createdBy/Email per operazioni automatiche** (cron, trigger, script)
3. **Passa sempre createdBy/Email per operazioni utente** (Cloud Functions API)
4. **Usa helper frontend** per visualizzazione consistente
5. **Testa entrambi i casi** (utente e sistema) nei test

### ❌ DON'T

1. **Non creare oggetti manualmente** senza factory
2. **Non modificare createdBy/Email dopo la creazione**
3. **Non usare valori custom per sistema** (usa solo SYSTEM_USER)
4. **Non dimenticare di aggiornare lastModifiedBy nelle update**

## 🔐 Sicurezza

Le Firestore rules **non** verificano i campi audit (sono gestiti server-side):

```javascript
// firestore.rules
match /anagrafica_clienti/{clientId} {
  // Lettura: tutti autenticati
  allow read: if request.auth != null;

  // Scrittura: SOLO tramite Cloud Functions
  // Le Cloud Functions hanno accesso admin e bypassano le rules
  allow write: if false;
}
```

I campi audit sono **trusted** perché settati solo da:
- Cloud Functions (backend)
- Trigger Firestore (backend)
- Cron jobs (backend)

Il client **non può** scrivere direttamente in queste collection.

## 🚀 Migrazione Dati Esistenti

Se hai dati esistenti senza i nuovi campi audit, esegui uno script di migrazione:

```javascript
// scripts/migrate-audit-fields.js
import { getFirestore } from 'firebase-admin/firestore';
import { SYSTEM_USER } from '../shared/schemas/entityFactory.js';

const db = getFirestore();

async function migrateAuditFields() {
  const snapshot = await db.collection('anagrafica_clienti').get();

  const batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Se manca lastModifiedBy, aggiungi campi SYSTEM
    if (!data.lastModifiedBy) {
      batch.update(doc.ref, {
        createdBy: data.createdBy || SYSTEM_USER.id,
        createdByEmail: data.createdByEmail || SYSTEM_USER.email,
        lastModifiedBy: data.lastModifiedBy || data.createdBy || SYSTEM_USER.id,
        lastModifiedByEmail: data.lastModifiedByEmail || data.createdByEmail || SYSTEM_USER.email
      });
      count++;
    }

    // Batch commit ogni 500 documenti
    if (count > 0 && count % 500 === 0) {
      await batch.commit();
      console.log(`Migrati ${count} documenti...`);
    }
  }

  if (count % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✅ Migrazione completata: ${count} documenti aggiornati`);
}

migrateAuditFields().catch(console.error);
```

## 📚 File Correlati

- Factory principale: [shared/schemas/entityFactory.js](../../shared/schemas/entityFactory.js)
- Helper frontend: [src/scripts/utils/systemUserHelper.js](../../src/scripts/utils/systemUserHelper.js)
- Esempio API: [functions/api/clienti.js](../../functions/api/clienti.js)
- Test: [tests/unit/entityFactory.test.js](../../tests/unit/entityFactory.test.js)
