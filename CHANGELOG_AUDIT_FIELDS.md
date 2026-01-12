# 🔄 Changelog: Standardizzazione Campi Audit

**Data**: 2026-01-12
**Priorità**: ALTA
**Breaking Change**: Sì (richiede aggiornamento API calls)

---

## 📋 Sommario Modifiche

Standardizzati i campi audit in **tutte le factory** per garantire tracking completo e consistente delle operazioni, sia da utenti che da processi automatici (cron, trigger, migration).

### Prima (Inconsistente):
```javascript
// createCliente aveva tutti i campi
{ createdBy, createdByEmail, lastModifiedBy, lastModifiedByEmail }

// createAttachment, createUtente, createComment avevano solo alcuni campi
{ createdBy, createdByEmail }
// ❌ Mancavano lastModifiedBy, lastModifiedByEmail
```

### Dopo (Standardizzato):
```javascript
// TUTTE le factory hanno gli stessi campi audit
{
  createdBy: "user-uid" | "SYSTEM",
  createdByEmail: "user@email.com" | "system@internal",
  lastModifiedBy: "user-uid" | "SYSTEM",
  lastModifiedByEmail: "user@email.com" | "system@internal",
  created: "2024-01-12T10:30:00.000Z",
  changed: "2024-01-12T10:30:00.000Z"
}
```

---

## 🆕 Novità: Sistema di Identificazione Operazioni Automatiche

### Costante SYSTEM_USER

```javascript
// shared/schemas/entityFactory.js
export const SYSTEM_USER = {
  id: 'SYSTEM',
  email: 'system@internal'
};
```

**Quando usare**: Operazioni automatiche senza utente umano (cron jobs, trigger, script migration).

### Esempio: Creazione da Cron Job

```javascript
// ❌ PRIMA (manuale)
const cliente = {
  ragione_sociale: 'Test',
  codice: 'T001',
  createdBy: null,  // Non tracciabile!
  created: new Date().toISOString()
};

// ✅ DOPO (automatico)
import { createCliente } from '../shared/schemas/entityFactory.js';

const cliente = createCliente({
  ragione_sociale: 'Test',
  codice: 'T001'
  // Non passa createdBy → usa SYSTEM automaticamente
});

// Risultato:
// {
//   ragione_sociale: 'Test',
//   codice: 'T001',
//   createdBy: 'SYSTEM',
//   createdByEmail: 'system@internal',
//   lastModifiedBy: 'SYSTEM',
//   lastModifiedByEmail: 'system@internal',
//   created: '2024-01-12T10:30:00.000Z',
//   changed: '2024-01-12T10:30:00.000Z'
// }
```

---

## 📂 File Modificati

### 1. **Factory Principali** ✅
- ✅ [shared/schemas/entityFactory.js](shared/schemas/entityFactory.js)
  - Aggiunta costante `SYSTEM_USER`
  - Aggiunta funzione helper `normalizeAuditFields()`
  - Aggiornate factory: `createAttachment`, `createCliente`, `createUtente`, `createComment`
  - Aggiunti JSDoc completi per ogni factory

### 2. **Sincronizzazione** ✅
- ✅ [functions/schemas/entityFactory.js](functions/schemas/entityFactory.js)
  - Auto-sincronizzato via `npm run sync-factories`

### 3. **Helper Frontend** 🆕
- 🆕 [src/scripts/utils/systemUserHelper.js](src/scripts/utils/systemUserHelper.js)
  - `isSystemCreated(entity)` - Verifica se creato dal sistema
  - `isSystemModified(entity)` - Verifica se modificato dal sistema
  - `getCreatorDisplayName(entity)` - Nome formattato ("🤖 Sistema Automatico" o email)
  - `getModifierDisplayName(entity)` - Nome formattato modificatore
  - `getCreatorClass(entity)` - Classe CSS per styling
  - `getModifierClass(entity)` - Classe CSS per styling
  - `getAuditInfo(entity)` - Info complete formattate

### 4. **Documentazione** 🆕
- 🆕 [docs/architecture/SYSTEM_USER.md](docs/architecture/SYSTEM_USER.md)
  - Guida completa uso SYSTEM_USER
  - Esempi concreti (cron, trigger, migration)
  - Pattern UI per visualizzazione
  - Best practices e security

### 5. **Test Aggiornati** ✅
- ✅ [tests/unit/entityFactory.test.js](tests/unit/entityFactory.test.js)
  - Aggiunti test per SYSTEM_USER
  - Test per tutte le factory (createCliente, createUtente, createComment, createAttachment)
  - Verifica campi audit completi
  - Test con e senza createdBy (utente vs sistema)

### 6. **Changelog** 🆕
- 🆕 [CHANGELOG_AUDIT_FIELDS.md](CHANGELOG_AUDIT_FIELDS.md) (questo file)

---

## 🔄 Migrazione Richiesta

### API Backend (Opzionale - già gestito)

Le API esistenti **già passano** `createdBy` e `createdByEmail`, quindi funzionano automaticamente con i nuovi campi.

**Verifica**: Tutte le API in `functions/api/` già usano:
```javascript
const nuovo = createCliente({
  ...data,
  createdBy: uid,
  createdByEmail: token.email
});
```

✅ **Nessuna modifica necessaria alle API esistenti**

### Dati Esistenti in Firestore (Se necessario)

Se hai dati vecchi senza `lastModifiedBy`, esegui script di migrazione:

```bash
node scripts/migrate-audit-fields.js
```

Vedi: [docs/architecture/SYSTEM_USER.md - Migrazione](docs/architecture/SYSTEM_USER.md#-migrazione-dati-esistenti)

---

## 🧪 Testing

### Eseguire Test Unitari

```bash
npm run test:unit
```

**Output atteso**:
```
PASS tests/unit/entityFactory.test.js
  Unit Test: entityFactory
    createAttachment
      ✓ dovrebbe creare un attachment con audit fields quando createdBy è fornito
      ✓ dovrebbe usare SYSTEM quando createdBy non è fornito
    createCliente
      ✓ dovrebbe creare un cliente con audit fields completi
      ✓ dovrebbe usare SYSTEM quando createdBy non è fornito
      ✓ dovrebbe lanciare errore se mancano campi obbligatori
    createUtente
      ✓ dovrebbe creare un utente con audit fields completi
      ✓ dovrebbe usare SYSTEM quando createdBy non è fornito
    createComment
      ✓ dovrebbe creare un commento con audit fields completi
      ✓ dovrebbe usare SYSTEM quando createdBy non è fornito
    SYSTEM_USER constant
      ✓ dovrebbe avere valori costanti predefiniti

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

### Eseguire Test Integrazione (Raccomandato)

```bash
npm test
```

Verifica che tutte le API continuino a funzionare correttamente.

---

## 📖 Uso nel Frontend

### Import Helper

```javascript
import {
  isSystemCreated,
  getCreatorDisplayName,
  getAuditInfo
} from './utils/systemUserHelper.js';
```

### Esempio: Tabella Clienti

```javascript
function renderCliente(cliente) {
  const audit = getAuditInfo(cliente);

  return `
    <tr>
      <td>${cliente.ragione_sociale}</td>
      <td class="${audit.creatorClass}">
        ${audit.createdBy}
        ${audit.isSystemCreated ? '<span class="badge">Auto</span>' : ''}
      </td>
      <td class="${audit.modifierClass}">
        ${audit.modifiedBy}
      </td>
    </tr>
  `;
}
```

### Styling CSS

```css
.system-created,
.system-modified {
  color: #6366f1; /* Indigo */
  font-style: italic;
}

.badge {
  background: #e0e7ff;
  color: #4338ca;
  padding: 2px 6px;
  font-size: 0.75rem;
  border-radius: 4px;
}
```

---

## 🎯 Uso in Cron Jobs / Trigger

### Cron Job Esempio

```javascript
// functions/cron/importData.js
import { createCliente } from '../../shared/schemas/entityFactory.js';

export const importClientiCron = onSchedule('0 2 * * *', async () => {
  const db = getFirestore();
  const externalData = await fetchFromExternalAPI();

  for (const item of externalData) {
    const cliente = createCliente({
      ragione_sociale: item.name,
      codice: item.code
      // ✅ Non passa createdBy → diventa SYSTEM automaticamente
    });

    await db.collection('anagrafica_clienti').add(cliente);
    console.log(`Cliente ${cliente.codice} importato automaticamente`);
  }
});
```

### Trigger Firestore Esempio

```javascript
// functions/triggers/onUserCreate.js
import { createUtente } from '../../shared/schemas/entityFactory.js';

export const syncUserToFirestore = onDocumentCreated('users/{userId}', async (event) => {
  const authUser = event.data.data();

  const firestoreUser = createUtente({
    uid: authUser.uid,
    email: authUser.email,
    ruolo: 'operatore'
    // ✅ Non passa createdBy → diventa SYSTEM (trigger automatico)
  });

  await admin.firestore()
    .collection('users')
    .doc(authUser.uid)
    .set(firestoreUser);
});
```

---

## 🔒 Sicurezza

### Firestore Rules (Nessuna modifica necessaria)

Le regole **non cambiano** perché i campi audit sono gestiti server-side:

```javascript
// firestore.rules
match /anagrafica_clienti/{clientId} {
  allow read: if request.auth != null;
  allow write: if false;  // Solo Cloud Functions possono scrivere
}
```

I client **non possono** manipolare campi audit perché:
1. Write diretta è disabilitata (`allow write: if false`)
2. Tutte le modifiche passano per Cloud Functions
3. Cloud Functions hanno accesso admin (bypassano rules)

---

## ✅ Checklist Post-Migrazione

- [x] Factory aggiornate con campi audit standardizzati
- [x] SYSTEM_USER costante definita ed esportata
- [x] Helper frontend creato (systemUserHelper.js)
- [x] Documentazione completa (SYSTEM_USER.md)
- [x] Test unitari aggiornati e passano
- [x] Sincronizzazione factory (npm run sync-factories)
- [ ] Test integrazione eseguiti (npm test) - Da eseguire
- [ ] Test E2E verificati (npm run test:e2e) - Da eseguire
- [ ] Dati esistenti migrati (se necessario)
- [ ] Deploy produzione

---

## 📚 Risorse

- **Guida completa**: [docs/architecture/SYSTEM_USER.md](docs/architecture/SYSTEM_USER.md)
- **Helper frontend**: [src/scripts/utils/systemUserHelper.js](src/scripts/utils/systemUserHelper.js)
- **Factory sorgente**: [shared/schemas/entityFactory.js](shared/schemas/entityFactory.js)
- **Test unitari**: [tests/unit/entityFactory.test.js](tests/unit/entityFactory.test.js)

---

## 🚀 Prossimi Passi (Opzionali)

1. **Visualizzazione UI**: Aggiungere icone/badge per operazioni sistema nelle tabelle
2. **Filtri**: Aggiungere filtro "Mostra solo operazioni automatiche" nelle liste
3. **Dashboard**: Grafico operazioni manuali vs automatiche
4. **Alert**: Notifica se troppe operazioni falliscono in cron jobs

---

## ❓ FAQ

### Q: Devo modificare le API esistenti?
**A**: No, le API già passano `createdBy/Email`, funzionano automaticamente.

### Q: Cosa succede ai dati vecchi senza lastModifiedBy?
**A**: Continueranno a funzionare. Usa script migrazione se vuoi normalizzarli.

### Q: Come identifico operazioni di sistema nel frontend?
**A**: Usa `isSystemCreated()` o `getAuditInfo()` da systemUserHelper.js

### Q: Posso usare valori custom invece di SYSTEM?
**A**: No, usa sempre SYSTEM_USER per consistenza. Se serve categorizzare (es: "CRON_IMPORT", "TRIGGER_SYNC"), aggiungi un campo metadata separato.

### Q: I test passano tutti?
**A**: Sì, test unitari passano. Verifica test integrazione con `npm test`.

---

## 👤 Autore

Modifiche implementate da: Claude Code (AI Assistant)
Richiesta da: Fabio
Data: 2026-01-12
