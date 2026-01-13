# 🧪 Testing Audit e AuditLogger

**Data**: 2026-01-12
**Versione**: 1.0
**Status**: Guida Implementazione

---

## 🎯 Panoramica

Questa guida descrive come testare il sistema di audit logging in modo completo, con 4 approcci diversi:

1. **🔬 Unit Test** - Test isolati con mocking
2. **🔗 Integration Test** - Test con Firestore Emulator
3. **🖱️ Manual Test** - Test manuali via UI
4. **📊 Visual Test** - Ispezione dashboard Firestore

---

## 1️⃣ Unit Test (Jest + Mock)

### Setup Unit Test

**File**: `functions/utils/__tests__/auditLogger.test.ts`

```typescript
import { logAudit, AuditAction, sanitizeData } from '../auditLogger';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn().mockResolvedValue({ id: 'mock-audit-id' })
    }))
  }))
}));

describe('🔒 AuditLogger Unit Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logAudit()', () => {

    it('dovrebbe creare un audit log con parametri obbligatori', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: 'audit-123' });
      const mockCollection = jest.fn().mockReturnValue({ add: mockAdd });
      (admin.firestore as jest.Mock).mockReturnValue({
        collection: mockCollection
      });

      const result = await logAudit({
        entityType: 'anagrafica_clienti',
        entityId: 'CLI001',
        action: AuditAction.CREATE,
        userId: 'user-123',
        userEmail: 'test@example.com'
      });

      expect(result).toBe('audit-123');
      expect(mockCollection).toHaveBeenCalledWith('audit_logs');
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'anagrafica_clienti',
          entityId: 'CLI001',
          action: 'create',
          userId: 'user-123',
          userEmail: 'test@example.com',
          timestamp: expect.any(Date)
        })
      );
    });

    it('dovrebbe validare parametri obbligatori mancanti', async () => {
      await expect(logAudit({
        entityType: '',
        entityId: 'CLI001',
        action: AuditAction.CREATE
      })).rejects.toThrow('entityType, entityId e action sono obbligatori');
    });

    it('dovrebbe validare azione non valida', async () => {
      await expect(logAudit({
        entityType: 'anagrafica_clienti',
        entityId: 'CLI001',
        action: 'invalid-action' as any
      })).rejects.toThrow('Azione non valida');
    });

    it('dovrebbe sanitizzare oldData e newData', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: 'audit-123' });
      const mockCollection = jest.fn().mockReturnValue({ add: mockAdd });
      (admin.firestore as jest.Mock).mockReturnValue({
        collection: mockCollection
      });

      const dataWithPassword = {
        ragione_sociale: 'Acme Corp',
        email: 'info@acme.com',
        password: 'secret123' // ❌ Deve essere mascherato
      };

      await logAudit({
        entityType: 'users',
        entityId: 'user-123',
        action: AuditAction.UPDATE,
        oldData: dataWithPassword,
        newData: dataWithPassword
      });

      const callArgs = mockAdd.mock.calls[0][0];
      expect(callArgs.oldData.password).toBe('***REDACTED***');
      expect(callArgs.newData.password).toBe('***REDACTED***');
      expect(callArgs.oldData.ragione_sociale).toBe('Acme Corp');
    });

    it('dovrebbe aggiungere metadata e source', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: 'audit-123' });
      const mockCollection = jest.fn().mockReturnValue({ add: mockAdd });
      (admin.firestore as jest.Mock).mockReturnValue({
        collection: mockCollection
      });

      await logAudit({
        entityType: 'anagrafica_clienti',
        entityId: 'CLI001',
        action: AuditAction.CREATE,
        metadata: { ip: '192.168.1.1', userAgent: 'Chrome' },
        source: 'web'
      });

      const callArgs = mockAdd.mock.calls[0][0];
      expect(callArgs.metadata).toEqual({ ip: '192.168.1.1', userAgent: 'Chrome' });
      expect(callArgs.source).toBe('web');
    });

    it('dovrebbe usare source="unknown" se non specificato', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: 'audit-123' });
      const mockCollection = jest.fn().mockReturnValue({ add: mockAdd });
      (admin.firestore as jest.Mock).mockReturnValue({
        collection: mockCollection
      });

      await logAudit({
        entityType: 'anagrafica_clienti',
        entityId: 'CLI001',
        action: AuditAction.CREATE
      });

      const callArgs = mockAdd.mock.calls[0][0];
      expect(callArgs.source).toBe('unknown');
    });
  });

  describe('sanitizeData()', () => {

    it('dovrebbe mascherare password', () => {
      const data = { username: 'admin', password: 'secret123' };
      const sanitized = sanitizeData(data);

      expect(sanitized.password).toBe('***REDACTED***');
      expect(sanitized.username).toBe('admin');
    });

    it('dovrebbe mascherare campi sensibili annidati', () => {
      const data = {
        user: {
          name: 'John',
          credentials: {
            password: 'secret',
            apiKey: 'abc123'
          }
        }
      };

      const sanitized = sanitizeData(data);

      expect(sanitized.user.credentials.password).toBe('***REDACTED***');
      expect(sanitized.user.credentials.apiKey).toBe('***REDACTED***');
      expect(sanitized.user.name).toBe('John');
    });

    it('dovrebbe gestire array', () => {
      const data = {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', password: 'secret2' }
        ]
      };

      const sanitized = sanitizeData(data);

      expect(sanitized.users[0].password).toBe('***REDACTED***');
      expect(sanitized.users[1].password).toBe('***REDACTED***');
      expect(sanitized.users[0].name).toBe('John');
    });

    it('dovrebbe gestire valori null/undefined', () => {
      expect(sanitizeData(null)).toBe(null);
      expect(sanitizeData(undefined)).toBe(undefined);
      expect(sanitizeData('string')).toBe('string');
      expect(sanitizeData(123)).toBe(123);
    });
  });
});
```

### Eseguire Unit Test

```bash
# Installa dipendenze di test
npm install --save-dev jest @types/jest ts-jest

# Configura Jest (jest.config.js)
cat > functions/jest.config.js <<EOF
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'utils/**/*.ts',
    'api/**/*.ts',
    '!**/__tests__/**',
    '!**/node_modules/**'
  ]
};
EOF

# Esegui test
cd functions
npm test

# Esegui con coverage
npm test -- --coverage
```

---

## 2️⃣ Integration Test (Firestore Emulator)

### Setup Integration Test

**File**: `functions/__tests__/integration/auditLogger.integration.test.ts`

```typescript
import * as admin from 'firebase-admin';
import { logAudit, AuditAction, getAuditLogs } from '../../utils/auditLogger';

// Setup Firestore Emulator
beforeAll(async () => {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: 'test-project'
    });
  }
});

afterAll(async () => {
  await admin.app().delete();
});

afterEach(async () => {
  // Pulisci audit_logs collection dopo ogni test
  const db = admin.firestore();
  const snapshot = await db.collection('audit_logs').get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
});

describe('🔗 AuditLogger Integration Tests', () => {

  it('dovrebbe creare un audit log in Firestore', async () => {
    const db = admin.firestore();

    const auditId = await logAudit({
      entityType: 'anagrafica_clienti',
      entityId: 'CLI001',
      action: AuditAction.CREATE,
      userId: 'user-123',
      userEmail: 'test@example.com',
      newData: { ragione_sociale: 'Acme Corp' },
      source: 'web'
    });

    // Verifica che il documento esista
    const doc = await db.collection('audit_logs').doc(auditId).get();
    expect(doc.exists).toBe(true);

    const data = doc.data();
    expect(data?.entityType).toBe('anagrafica_clienti');
    expect(data?.entityId).toBe('CLI001');
    expect(data?.action).toBe('create');
    expect(data?.userId).toBe('user-123');
    expect(data?.userEmail).toBe('test@example.com');
    expect(data?.newData).toEqual({ ragione_sociale: 'Acme Corp' });
    expect(data?.source).toBe('web');
    expect(data?.timestamp).toBeInstanceOf(Date);
  });

  it('dovrebbe recuperare audit logs per entità', async () => {
    // Crea 3 audit logs
    await logAudit({
      entityType: 'anagrafica_clienti',
      entityId: 'CLI001',
      action: AuditAction.CREATE
    });

    await logAudit({
      entityType: 'anagrafica_clienti',
      entityId: 'CLI001',
      action: AuditAction.UPDATE
    });

    await logAudit({
      entityType: 'anagrafica_clienti',
      entityId: 'CLI002', // Diverso ID
      action: AuditAction.CREATE
    });

    // Recupera logs per CLI001
    const logs = await getAuditLogs('anagrafica_clienti', 'CLI001');

    expect(logs.length).toBe(2);
    expect(logs[0].action).toBe('update'); // Più recente
    expect(logs[1].action).toBe('create');
  });

  it('dovrebbe tracciare UPDATE con oldData e newData', async () => {
    const oldData = {
      ragione_sociale: 'Acme Corp',
      email: 'old@acme.com'
    };

    const newData = {
      ragione_sociale: 'Acme Corporation',
      email: 'new@acme.com'
    };

    const auditId = await logAudit({
      entityType: 'anagrafica_clienti',
      entityId: 'CLI001',
      action: AuditAction.UPDATE,
      userId: 'user-123',
      oldData,
      newData
    });

    const db = admin.firestore();
    const doc = await db.collection('audit_logs').doc(auditId).get();
    const data = doc.data();

    expect(data?.oldData).toEqual(oldData);
    expect(data?.newData).toEqual(newData);
  });

  it('dovrebbe tracciare DELETE con oldData', async () => {
    const oldData = {
      ragione_sociale: 'Acme Corp',
      email: 'info@acme.com'
    };

    const auditId = await logAudit({
      entityType: 'anagrafica_clienti',
      entityId: 'CLI001',
      action: AuditAction.DELETE,
      userId: 'user-123',
      oldData
    });

    const db = admin.firestore();
    const doc = await db.collection('audit_logs').doc(auditId).get();
    const data = doc.data();

    expect(data?.action).toBe('delete');
    expect(data?.oldData).toEqual(oldData);
    expect(data?.newData).toBeNull();
  });
});
```

### Eseguire Integration Test

```bash
# 1. Avvia Firebase Emulator
firebase emulators:start --only firestore

# 2. In un altro terminale, esegui i test
cd functions
npm test -- --testPathPattern=integration
```

---

## 3️⃣ Manual Test (UI Testing)

### Test CREATE Cliente

1. **Setup**: Apri DevTools Console (`F12`)
2. **Azione**: Crea un nuovo cliente via UI
3. **Verifica**: Controlla console logs

```javascript
// Nel browser console
const db = firebase.firestore();

// Ascolta audit logs in real-time
db.collection('audit_logs')
  .where('entityType', '==', 'anagrafica_clienti')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .onSnapshot(snapshot => {
    console.log('📝 Audit Logs:', snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  });
```

**Verifica che contenga**:
- ✅ `action: "create"`
- ✅ `userId` dell'utente loggato
- ✅ `userEmail` dell'utente loggato
- ✅ `newData` con dati del cliente
- ✅ `source: "web"`
- ✅ `timestamp` corretto

### Test UPDATE Cliente

1. **Azione**: Modifica un cliente esistente
2. **Verifica**: Nuovo audit log con:
   - ✅ `action: "update"`
   - ✅ `oldData` (stato precedente)
   - ✅ `newData` (stato nuovo)
   - ✅ Differenze visibili tra oldData e newData

### Test DELETE Cliente

1. **Azione**: Elimina un cliente
2. **Verifica**: Audit log con:
   - ✅ `action: "delete"`
   - ✅ `oldData` (dati eliminati)
   - ✅ `newData: null`

---

## 4️⃣ Visual Test (Firestore Dashboard)

### Ispezionare Audit Logs

1. Vai su **Firebase Console** → **Firestore Database**
2. Naviga a collection `audit_logs`
3. Ordina per `timestamp` DESC
4. Verifica documenti recenti

### Campi da Verificare

Per ogni documento audit:

```json
{
  "entityType": "anagrafica_clienti",
  "entityId": "CLI001",
  "action": "create",
  "userId": "abc123...",
  "userEmail": "admin@example.com",
  "timestamp": Timestamp,
  "oldData": null,
  "newData": {
    "ragione_sociale": "Acme Corp",
    "codice": "CLI001",
    "email": "info@acme.com",
    "created": Timestamp,
    "changed": Timestamp,
    "createdBy": "abc123...",
    "createdByEmail": "admin@example.com",
    "lastModifiedBy": "abc123...",
    "lastModifiedByEmail": "admin@example.com"
  },
  "metadata": {},
  "source": "web",
  "details": null
}
```

### Query Firestore per Testing

```javascript
// Audit logs per utente specifico
db.collection('audit_logs')
  .where('userId', '==', 'USER_ID')
  .orderBy('timestamp', 'desc')
  .limit(50)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => console.log(doc.data()));
  });

// Audit logs per tipo di azione
db.collection('audit_logs')
  .where('action', '==', 'delete')
  .orderBy('timestamp', 'desc')
  .get()
  .then(snapshot => {
    console.log(`Trovati ${snapshot.size} DELETE`);
  });

// Audit logs per entità specifica
db.collection('audit_logs')
  .where('entityType', '==', 'anagrafica_clienti')
  .where('entityId', '==', 'CLI001')
  .orderBy('timestamp', 'desc')
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`${data.action} by ${data.userEmail} at ${data.timestamp.toDate()}`);
    });
  });
```

---

## 5️⃣ Test Sanitizzazione Dati Sensibili

### Test Password Masking

```typescript
// Test manuale via Node.js
import { logAudit, AuditAction } from './functions/utils/auditLogger';

const testData = {
  username: 'admin',
  password: 'SuperSecret123!',
  email: 'admin@example.com',
  apiKey: 'sk_live_abc123def456',
  profile: {
    name: 'Admin User',
    secret: 'hidden-value'
  }
};

await logAudit({
  entityType: 'users',
  entityId: 'user-123',
  action: AuditAction.UPDATE,
  oldData: testData,
  newData: testData
});

// Verifica in Firestore che:
// - password: "***REDACTED***"
// - apiKey: "***REDACTED***"
// - secret: "***REDACTED***"
// - username: "admin" (non mascherato)
// - email: "admin@example.com" (non mascherato)
```

---

## 6️⃣ Test Performance

### Load Test per Audit Logging

```typescript
// Test di carico: crea 100 audit logs
async function loadTest() {
  const promises = [];

  for (let i = 0; i < 100; i++) {
    promises.push(
      logAudit({
        entityType: 'test_entity',
        entityId: `TEST-${i}`,
        action: AuditAction.CREATE,
        userId: 'load-test-user',
        userEmail: 'test@example.com',
        newData: { index: i }
      })
    );
  }

  const start = Date.now();
  await Promise.all(promises);
  const duration = Date.now() - start;

  console.log(`✅ Creati 100 audit logs in ${duration}ms`);
  console.log(`⏱️ Media: ${duration / 100}ms per log`);
}

loadTest();
```

**Obiettivo**: < 50ms per audit log

---

## 7️⃣ Test Errori

### Test Failure Handling

```typescript
describe('Error Handling', () => {

  it('dovrebbe gestire errori di connessione Firestore', async () => {
    // Mock Firestore error
    jest.spyOn(admin.firestore(), 'collection').mockImplementation(() => {
      throw new Error('Firestore unavailable');
    });

    await expect(logAudit({
      entityType: 'test',
      entityId: 'test-123',
      action: AuditAction.CREATE
    })).rejects.toThrow('Firestore unavailable');
  });

  it('dovrebbe propagare errori ma non bloccare operazioni', async () => {
    // In produzione, potresti voler loggare l'errore ma non bloccare
    try {
      await logAudit({ /* parametri invalidi */ });
    } catch (error) {
      console.error('Audit log fallito:', error);
      // L'operazione principale continua
    }
  });
});
```

---

## 📊 Checklist Testing Completa

### Unit Tests
- [ ] logAudit() con parametri obbligatori
- [ ] Validazione parametri mancanti
- [ ] Validazione azione non valida
- [ ] Sanitizzazione password
- [ ] Sanitizzazione campi sensibili annidati
- [ ] Sanitizzazione array
- [ ] Gestione null/undefined
- [ ] Metadata e source opzionali

### Integration Tests
- [ ] Creazione documento in Firestore
- [ ] Recupero logs per entità
- [ ] Recupero logs per utente
- [ ] Tracciamento CREATE con newData
- [ ] Tracciamento UPDATE con oldData + newData
- [ ] Tracciamento DELETE con oldData
- [ ] Query con filtri multipli
- [ ] Ordinamento per timestamp DESC

### Manual Tests
- [ ] CREATE cliente via UI
- [ ] UPDATE cliente via UI
- [ ] DELETE cliente via UI
- [ ] Verifica audit fields in Firestore
- [ ] Verifica timestamp corretti
- [ ] Verifica source="web"

### Performance Tests
- [ ] Load test 100 logs < 5s totali
- [ ] Single log < 50ms
- [ ] Memory usage stabile
- [ ] No memory leaks

### Security Tests
- [ ] Password mascherata
- [ ] API Key mascherata
- [ ] Secret mascherata
- [ ] Token mascherati
- [ ] Dati pubblici non mascherati

---

## 🚀 Quick Start

```bash
# 1. Setup test environment
cd functions
npm install --save-dev jest @types/jest ts-jest
npm install --save-dev @firebase/testing

# 2. Crea jest.config.js
# (vedi configurazione sopra)

# 3. Crea cartella test
mkdir -p utils/__tests__
mkdir -p __tests__/integration

# 4. Copia unit test template
# (vedi esempi sopra)

# 5. Avvia emulator
firebase emulators:start --only firestore

# 6. Esegui test
npm test

# 7. Verifica coverage
npm test -- --coverage
```

---

## 📚 Risorse

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Firebase Test SDK](https://firebase.google.com/docs/rules/unit-tests)
- [Firestore Emulator](https://firebase.google.com/docs/emulator-suite)

---

**Data ultimo aggiornamento**: 2026-01-12
**Revisione**: v1.0
**Status**: Guida Implementazione ✅
