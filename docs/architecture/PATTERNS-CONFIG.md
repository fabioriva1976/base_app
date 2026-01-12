# 🔧 Pattern Configurazioni - Template Base App

**Versione:** 1.0
**Data:** 2026-01-09
**Obiettivo:** Documentazione per AI - Pattern replicabili per nuove pagine di configurazione

---

## 🎯 Come Usare Questo Documento

Questo documento definisce i **pattern standard** per creare nuove pagine di configurazione (es: configurazione database, API esterne, servizi cloud).

Ogni nuova configurazione DEVE seguire questi pattern per garantire:
- ✅ Coerenza dell'interfaccia utente
- ✅ Gestione sicura dei secrets (API keys, password)
- ✅ Test funzionali per verificare la configurazione
- ✅ Audit trail completo (chi, cosa, quando)

---

## 📋 Checklist per Nuova Configurazione

Quando crei una nuova configurazione (es: `database`, `payment`), devi creare questi file:

### 1. API Backend
- [ ] `functions/api/settings-[nome].ts` - GET/SAVE per la configurazione
- [ ] `functions/api/checkSettings-[nome].ts` - Test funzionale della configurazione

### 2. Frontend
- [ ] `src/pages/settings-[nome].astro` - Pagina configurazione
- [ ] `src/scripts/settings-[nome].ts` - Logica frontend

### 3. Firestore Document
- [ ] Documento in `settings/[nome]` - Salvataggio parametri

### 4. Export in index.ts
- [ ] `functions/index.ts` - Export delle API

---

## 📚 Configurazioni Template Esistenti

Il progetto include 2 settings completamente documentate:

### 1. **SMTP** (Configurazione Email)
File di riferimento più completo per settings con secrets.

- 📄 **API Config**: [functions/api/settings-smtp.ts](functions/api/settings-smtp.ts)
- 🧪 **API Test**: [functions/api/checkSettings-smtp.ts](functions/api/checkSettings-smtp.ts)
- 🎨 **Frontend Page**: [src/pages/settings-smtp.astro](src/pages/settings-smtp.astro)
- 📜 **Frontend Script**: [src/scripts/settings-smtp.ts](src/scripts/settings-smtp.ts)
- 🗄️ **Document**: `settings/smtp`
- 👥 **Permessi**: Admin per R, Superuser per W
- 🔐 **Secrets**: `password`, `user`

**Quando usare come template:**
- Configurazioni che richiedono secrets (password, API keys)
- Servizi esterni che necessitano di test di connessione
- Configurazioni con parametri di rete (host, port)
- Esempi: database, FTP, SFTP, message queue

**Campi tipici:**
```javascript
{
  host: String,           // Server host
  port: Number,           // Server port
  user: String,           // Username
  password: String,       // Password (secret)
  from: String,           // Email mittente
  fromName: String,       // Nome mittente
  secure: Boolean,        // Usa TLS/SSL
  created: Timestamp,     // Creazione record
  changed: Timestamp,     // Ultimo aggiornamento
  updatedBy: String,      // UID utente
  updatedByEmail: String  // Email utente
}
```

### 2. **AI** (Configurazione AI Provider)
Template per settings multi-provider.

- 📄 **API Config**: [functions/api/settings-ai.ts](functions/api/settings-ai.ts)
- 🧪 **API Test**: [functions/api/checkSettings-ai.ts](functions/api/checkSettings-ai.ts)
- 🎨 **Frontend Page**: [src/pages/settings-ai.astro](src/pages/settings-ai.astro)
- 📜 **Frontend Script**: [src/scripts/settings-ai.ts](src/scripts/settings-ai.ts)
- 🗄️ **Document**: `settings/ai`
- 👥 **Permessi**: Admin per R, Superuser per W
- 🔐 **Secrets**: `apiKey`

**Quando usare come template:**
- Configurazioni con provider multipli (Google, OpenAI, Azure, etc.)
- Servizi AI/ML
- API esterne con vari provider
- Configurazioni con parametri avanzati (temperature, timeout)

**Campi tipici:**
```javascript
{
  provider: String,       // Provider selezionato (google, openai, anthropic, azure)
  apiKey: String,         // API Key (secret)
  model: String,          // Modello AI
  temperature: Number,    // Parametro AI
  maxTokens: Number,      // Limite token
  timeout: Number,        // Timeout richiesta
  systemPrompt: String,   // Prompt di sistema
  ragCorpusId: String,    // Corpus RAG (opzionale)
  ragLocation: String,    // Regione corpus
  enableContext: Boolean, // Abilita contesto
  enableSafety: Boolean,  // Abilita safety
  created: Timestamp,     // Creazione record
  changed: Timestamp,     // Ultimo aggiornamento
  updatedBy: String,      // UID utente
  updatedByEmail: String  // Email utente
}
```

---

## 🏗️ PATTERN 1: API Config (GET/SAVE)

**File:** `functions/api/settings-[nome].ts`

### Template Base:

```javascript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { region, corsOrigins, runtimeOpts } from "../config.ts";
import { requireSuperUser, requireAdmin } from "../utils/authHelpers.ts";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Validazione dati configurazione
 * Lancia HttpsError se i dati non sono validi
 */
function validate[ConfigName](data) {
  const requiredFields = ["campo1", "campo2", "campo3"];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio per configurazione [Nome]`);
    }
  }

  return {
    campo1: String(data.campo1),
    campo2: Number(data.campo2),
    campo3: String(data.campo3),
    campoBoolean: Boolean(data.campoBoolean)
  };
}

/**
 * 🎯 GET: Lettura configurazione
 *
 * Permessi: ADMIN o SUPERUSER
 * Output: { exists: boolean, data: {...} | null }
 */
export const getConfig[Name]Api = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireAdmin(request);

    const db = admin.firestore();
    const docSnap = await db.collection("settings").doc("[nome]").get();
    if (!docSnap.exists) {
      return { exists: false, data: null };
    }
    return { exists: true, data: docSnap.data() };
  }
);

/**
 * 🎯 SAVE: Salvataggio configurazione
 *
 * Permessi: SOLO SUPERUSER
 * Input: { data: {...campi configurazione} }
 * Output: { success: true }
 */
export const saveConfig[Name]Api = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireSuperUser(request);

    const sanitized = validate[ConfigName](request.data?.data || {});

    const db = admin.firestore();
    const now = new Date().toISOString();
    const userEmail = request.auth?.token?.email || null;

    const docRef = db.collection("settings").doc("[nome]");
    const existing = await docRef.get();
    const created = existing.exists ? existing.data()?.created || now : now;

    await docRef.set(
      {
        ...sanitized,
        created,
        changed: now,
        updatedBy: request.auth.uid,
        updatedByEmail: userEmail
      },
      { merge: true }
    );

    return { success: true };
  }
);
```

---

## 🧪 PATTERN 2: API Check (Test Configurazione)

**File:** `functions/api/checkSettings-[nome].ts`

### Template Base:

```javascript
import { onCall } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { region, corsOrigins, runtimeOpts } from "../config.ts";
import { requireSuperUser } from "../utils/authHelpers.ts";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

/**
 * 🎯 CHECK: Test configurazione
 *
 * Permessi: SOLO SUPERUSER
 * Input: { testParam: ... } (opzionale)
 * Output: { success: true, message: "...", details: {...} }
 */
export const check[Name]Api = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    console.log("🔍 check[Name]Api chiamata con request.data:", request.data);

    // ✅ SECURITY: Richiede ruolo superuser
    await requireSuperUser(request);

    const { testParam } = request.data;

    try {
        const db = admin.firestore();

        // 1. Carica configurazione da Firestore
        console.log("📋 Caricamento configurazione [Nome] da Firestore...");
        const configDoc = await db.collection("settings").doc("[nome]").get();

        if (!configDoc.exists) {
            console.error("❌ Documento configurazione [Nome] non trovato");
            throw new Error("❌ Configurazione [Nome] non trovata in Firestore. Configura prima di testare.");
        }

        const config = configDoc.data();
        console.log("✅ Configurazione [Nome] caricata:", {
            campo1: config.campo1,
            hasCampo2: !!config.campo2
        });

        // 2. Verifica parametri obbligatori
        if (!config.campo1 || !config.campo2) {
            console.error("❌ Configurazione incompleta");
            throw new Error("❌ Configurazione [Nome] incompleta. Verifica tutti i campi.");
        }

        console.log(`🔄 Testing [Nome] configuration...`);

        // 3. ESEGUI IL TEST EFFETTIVO
        // Esempio: connessione a servizio esterno, chiamata API, etc.
        const testResult = await performTest(config, testParam);

        console.log("✅ Test [Nome] completato:", testResult);

        return {
            success: true,
            message: "✅ Test [Nome] completato con successo!",
            details: {
                campo1: config.campo1,
                testResult: testResult
            }
        };

    } catch (error) {
        console.error("❌ Errore nel test [Nome]:", error);

        // Fornisci messaggi di errore specifici
        let errorMessage = "Errore durante il test della configurazione [Nome].";

        if (error.message && error.message.startsWith("❌")) {
            errorMessage = error.message;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = "❌ Connessione rifiutata. Verifica host e porta.";
        } else if (error.code === 'ETIMEDOUT') {
            errorMessage = "❌ Timeout della connessione. Verifica che il servizio sia raggiungibile.";
        } else if (error.message) {
            errorMessage = `❌ Errore: ${error.message}`;
        }

        console.error("Dettagli errore [Nome]:", {
            code: error.code,
            message: error.message
        });

        throw new Error(errorMessage);
    }
});

// Funzione helper per eseguire il test effettivo
async function performTest(config, testParam) {
    // Implementazione specifica del test
    // Es: connessione database, chiamata API, invio email test, etc.

    return {
        status: "ok",
        // ... altri dettagli del test
    };
}
```

---

## 🎨 PATTERN 3: Frontend Script

**File:** `src/scripts/settings-[nome].ts`

### Template Base:

```javascript
import { auth, functions } from '../lib/firebase-client';
import { httpsCallable } from "firebase/functions";

export function initSettings[Name]Page() {
    const form = document.getElementById('[nome]-config-form');
    const canModify = form?.dataset.canModify === 'true';

    loadCurrentConfig();
    setupEventListeners();

    // Se l'utente non può modificare, rendi il form read-only
    if (!canModify) {
        makeFormReadOnly();
    }
}

function makeFormReadOnly() {
    const form = document.getElementById('[nome]-config-form');
    if (!form) return;

    // Disabilita tutti gli input
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => input.disabled = true);

    // Disabilita i bottoni
    const saveBtn = form.querySelector('button[type="submit"]');
    const testBtn = document.getElementById('test-[nome]-btn');
    if (saveBtn) saveBtn.disabled = true;
    if (testBtn) testBtn.disabled = true;

    // Mostra messaggio informativo
    const description = form.closest('.config-section')?.querySelector('.description');
    if (description) {
        description.innerHTML = '<strong style="color: #f59e0b;">Solo i Superuser possono modificare le settings.</strong> Puoi visualizzare i parametri ma non modificarli.';
    }
}

function setupEventListeners() {
    const form = document.getElementById('[nome]-config-form');
    const testBtn = document.getElementById('test-[nome]-btn');

    if (form) {
        form.addEventListener('submit', handleSubmit);
    }

    if (testBtn) {
        testBtn.addEventListener('click', test[Name]);
    }
}

async function loadCurrentConfig() {
    try {
        const getConfig = httpsCallable(functions, 'getConfig[Name]Api');
        const result = await getConfig();

        if (result.data?.exists) {
            const data = result.data.data || {};

            // Popola il form
            document.getElementById('[nome]-campo1').value = data.campo1 || '';
            document.getElementById('[nome]-campo2').value = data.campo2 || '';
            document.getElementById('[nome]-checkbox').checked = data.campoBoolean || false;

            // Aggiorna lo stato
            updateStatus(data);
        }
    } catch (error) {
        console.error('Errore nel caricamento della configurazione:', error);

        if (error.code === 'permission-denied') {
            showMessage('⚠️ Solo i Superuser possono visualizzare le settings sensibili', 'error');
            makeFormReadOnly();
        } else {
            showMessage('Errore nel caricamento della configurazione', 'error');
        }
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    const originalWidth = submitBtn.getBoundingClientRect().width;

    submitBtn.style.minWidth = `${originalWidth}px`;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-loader"></span>Salvataggio...';

    try {
        const formData = new FormData(e.target);
        const configData = {
            campo1: formData.get('campo1'),
            campo2: parseInt(formData.get('campo2')),
            campoBoolean: document.getElementById('[nome]-checkbox').checked
        };

        const saveConfig = httpsCallable(functions, 'saveConfig[Name]Api');
        const result = await saveConfig({ data: configData });

        if (!result.data?.success && result.data?.success !== undefined) {
            throw new Error('Salvataggio non riuscito');
        }

        // Ricarica i dati dal server
        await loadCurrentConfig();

        showMessage('Configurazione salvata con successo!', 'success');

    } catch (error) {
        console.error('Errore nel salvare la configurazione:', error);
        showMessage('Errore: ' + (error.message || 'Impossibile salvare la configurazione'), 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        submitBtn.style.minWidth = '';
    }
}

async function test[Name]() {
    const btn = document.getElementById('test-[nome]-btn');
    const originalText = btn.textContent;
    const originalWidth = btn.getBoundingClientRect().width;

    btn.style.minWidth = `${originalWidth}px`;
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-loader"></span>Test in corso...';

    try {
        const testFunc = httpsCallable(functions, 'checkSettings[Name]Api');
        const result = await testFunc({ /* parametri test opzionali */ });

        if (result.data.success) {
            showMessage(result.data.message, 'success');
        } else {
            throw new Error(result.data.message || 'Test fallito');
        }
    } catch (error) {
        console.error('Errore nel test [Nome]:', error);

        let errorMessage = 'Impossibile testare la configurazione [Nome]';

        if (error.code === 'functions/internal') {
            if (error.details && error.details.message) {
                errorMessage = error.details.message;
            } else if (error.message && !error.message.includes('INTERNAL')) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Errore del server. Verifica la configurazione e riprova.';
            }
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.code === 'functions/unauthenticated') {
            errorMessage = 'Devi essere autenticato per testare la configurazione';
        } else if (error.code === 'functions/permission-denied') {
            errorMessage = 'Non hai i permessi per testare la configurazione';
        }

        showMessage('❌ ' + errorMessage, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.minWidth = '';
    }
}

function updateStatus(data) {
    const campo1Element = document.getElementById('status-campo1');
    const changedElement = document.getElementById('status-changed');

    if (campo1Element) {
        campo1Element.textContent = data.campo1 || 'Non configurato';
        campo1Element.className = data.campo1 ? 'status-value configured' : 'status-value not-configured';
    }

    if (changedElement && data.changed) {
        const date = data.changed.toDate ? data.changed.toDate() : new Date(data.changed);
        changedElement.textContent = date.toLocaleDateString('it-IT', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function showMessage(message, type) {
    // Preferisci il messaggio vicino ai pulsanti
    const messageElement = document.getElementById('save-message') || document.getElementById('form-message');
    if (!messageElement) return;

    messageElement.textContent = message;
    messageElement.className = `save-message ${type}`;
    messageElement.style.display = 'inline-block';

    setTimeout(() => {
        messageElement.style.display = 'none';
    }, 5000);
}
```

---

## 🚀 Export in index.ts

**File:** `functions/index.ts`

Ogni configurazione richiede 3 export:

```javascript
// === FUNZIONI API - SETTINGS ===
export {
    getConfig[Name]Api,
    saveConfig[Name]Api
} from "./api/settings-[nome].ts";

export { checkSettings[Name]Api } from "./api/checkSettings-[nome].ts";
```

**Esempio concreto (SMTP):**
```javascript
export {
    getConfigSmtpApi,
    saveConfigSmtpApi
} from "./api/settings-smtp.ts";

export { checkSmtpApi } from "./api/checkSettings-smtp.ts";
```

---

## 📝 Esempio Completo: Nuova Configurazione Database

### 1. Backend API Config

**File:** `functions/api/settings-database.ts`

```javascript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { region, corsOrigins, runtimeOpts } from "../config.ts";
import { requireSuperUser, requireAdmin } from "../utils/authHelpers.ts";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

function validateDatabase(data) {
  const requiredFields = ["host", "port", "database", "user", "password"];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      throw new HttpsError("invalid-argument", `Campo '${field}' obbligatorio`);
    }
  }

  return {
    host: String(data.host),
    port: Number(data.port),
    database: String(data.database),
    user: String(data.user),
    password: String(data.password),
    ssl: Boolean(data.ssl),
    maxConnections: Number(data.maxConnections) || 10
  };
}

export const getConfigDatabaseApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireAdmin(request);
    const db = admin.firestore();
    const docSnap = await db.collection("settings").doc("database").get();
    if (!docSnap.exists) {
      return { exists: false, data: null };
    }
    return { exists: true, data: docSnap.data() };
  }
);

export const saveConfigDatabaseApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    await requireSuperUser(request);
    const sanitized = validateDatabase(request.data?.data || {});
    const db = admin.firestore();
    const now = new Date().toISOString();

    await db.collection("settings").doc("database").set(
      {
        ...sanitized,
        changed: now,
        updatedBy: request.auth.uid,
        updatedByEmail: request.auth?.token?.email || null
      },
      { merge: true }
    );

    return { success: true };
  }
);
```

### 2. Backend API Check

**File:** `functions/api/checkSettings-database.ts`

```javascript
import { onCall } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import { createConnection } from "mysql2/promise";
import { region, corsOrigins, runtimeOpts } from "../config.ts";
import { requireSuperUser } from "../utils/authHelpers.ts";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

export const checkDatabaseApi = onCall(
  { region, cors: corsOrigins, ...runtimeOpts },
  async (request) => {
    console.log("🔍 checkDatabaseApi chiamata");
    await requireSuperUser(request);

    try {
        const db = admin.firestore();
        const configDoc = await db.collection("settings").doc("database").get();

        if (!configDoc.exists) {
            throw new Error("❌ Configurazione Database non trovata.");
        }

        const config = configDoc.data();

        // Test connessione database
        const connection = await createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            ssl: config.ssl ? { rejectUnauthorized: true } : false
        });

        // Esegui query di test
        const [rows] = await connection.execute('SELECT 1 as test');

        await connection.end();

        return {
            success: true,
            message: "✅ Connessione database verificata con successo!",
            details: {
                host: config.host,
                port: config.port,
                database: config.database
            }
        };

    } catch (error) {
        console.error("❌ Errore test database:", error);

        let errorMessage = "Errore durante il test database.";
        if (error.code === 'ECONNREFUSED') {
            errorMessage = "❌ Connessione rifiutata. Verifica host e porta.";
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            errorMessage = "❌ Accesso negato. Verifica username e password.";
        }

        throw new Error(errorMessage);
    }
});
```

### 3. Export in index.ts

```javascript
export {
    getConfigDatabaseApi,
    saveConfigDatabaseApi
} from "./api/settings-database.ts";

export { checkDatabaseApi } from "./api/checkSettings-database.ts";
```

---

## ✅ Best Practices Configurazioni

1. **Secrets sempre in Firestore:** Non hardcodare mai API keys o password
2. **Superuser per scrittura:** Solo superuser possono modificare settings
3. **Admin per lettura:** Admin e superuser possono leggere settings
4. **Test funzionali:** Sempre fornire una funzione `check[Nome]Api` per testare
5. **Validazione strict:** Valida tutti i campi obbligatori
6. **Error handling dettagliato:** Fornisci messaggi di errore specifici
7. **Audit trail:** Salva sempre `changed`, `updatedBy`, `updatedByEmail`
8. **Form read-only:** Se l'utente non è superuser, mostra form in sola lettura
9. **Messaggi uniformi:** Usa la funzione `showMessage(message, type)` standard
10. **CORS configurato:** Usa sempre `corsOrigins` da `config.ts`

---

## 🚀 Convenzioni di Naming

### Configurazioni
- **API Config File:** `functions/api/settings-[nome].ts`
- **API Check File:** `functions/api/checkSettings-[nome].ts`
- **Frontend Script:** `src/scripts/settings-[nome].ts`
- **Frontend Page:** `src/pages/settings-[nome].astro`
- **Firestore Document:** `settings/[nome]`

### Funzioni
- **GET Function:** `getConfig[Name]Api`
- **SAVE Function:** `saveConfig[Name]Api`
- **CHECK Function:** `checkSettings[Name]Api`
- **Init Function:** `initConfig[Name]Page()`

---

## 📚 Prossimi Passi

Per aggiungere una nuova configurazione:
1. Copia i pattern SMTP o AI (in base alle esigenze)
2. Sostituisci `[nome]` e `[Name]` con il nome della tua configurazione
3. Definisci i campi specifici necessari
4. Implementa la funzione di test in `checkSettings-[nome].ts`
5. Aggiungi gli export in `functions/index.ts`
6. Testa la configurazione dal frontend

**Tempo stimato per nuova configurazione:** 1-2 ore seguendo questi pattern.
