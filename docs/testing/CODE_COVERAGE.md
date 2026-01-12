# 📊 Code Coverage Report - Guida Completa

**Data**: 2026-01-12
**Versione**: 1.0
**Status**: ✅ Implementato

---

## 🎯 Cos'è il Code Coverage?

Il **Code Coverage** misura **quanta parte del tuo codice viene effettivamente eseguita durante i test**.

È una metrica fondamentale per:
- ✅ Identificare codice non testato (potenziali bug)
- ✅ Garantire qualità del codice
- ✅ Prevenire regressioni
- ✅ Guidare lo sviluppo AI-driven

---

## 🚀 Quick Start

### 1. Eseguire Coverage

```bash
# Esegui tutti i test con coverage report
npm run test:coverage

# Esegui solo test unitari con coverage
npm run test:coverage:unit

# Esegui coverage in watch mode (durante sviluppo)
npm run test:coverage:watch

# Esegui coverage e apri report HTML nel browser
npm run test:coverage:html
```

### 2. Dove trovare i report

Dopo aver eseguito `npm run test:coverage`, troverai i report in:

```
coverage/
├── lcov-report/           # 🌐 Report HTML navigabile
│   └── index.html         # Apri questo nel browser
├── coverage-final.json    # 📊 Dati raw JSON
├── coverage-summary.json  # 📋 Summary JSON
└── lcov.info             # 📄 Formato LCOV (per tool esterni)
```

---

## 📖 Come Leggere il Coverage Report

### Report in Console (Text)

Quando esegui `npm run test:coverage`, Jest mostra una tabella nella console:

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   87.23 |    84.61 |   89.47 |   87.23 |
 api                |   95.45 |    93.33 |   95.00 |   95.45 |
  clienti.js        |   96.77 |    95.00 |  100.00 |   96.77 | 145,289
  note.js           |   94.11 |    91.66 |   90.00 |   94.11 | 78,156,234
 schemas            |  100.00 |   100.00 |  100.00 |  100.00 |
  entityFactory.js  |  100.00 |   100.00 |  100.00 |  100.00 |
 utils              |   78.26 |    75.00 |   80.00 |   78.26 |
  authHelpers.js    |   91.30 |    88.88 |   90.00 |   91.30 | 45,67,89
  auditLogger.js    |   85.71 |    83.33 |   85.71 |   85.71 | 112,134
  validator.js      |   65.21 |    61.53 |   66.66 |   65.21 | 23-45,78-90
--------------------|---------|----------|---------|---------|-------------------
```

#### Interpretazione delle colonne:

| Colonna | Cosa Significa | Esempio |
|---------|----------------|---------|
| **File** | Nome del file o directory | `clienti.js` |
| **% Stmts** | Percentuale di statements eseguiti | `96.77%` = 30 su 31 statements |
| **% Branch** | Percentuale di rami condizionali testati | `95.00%` = 19 su 20 branches |
| **% Funcs** | Percentuale di funzioni chiamate | `100.00%` = tutte le funzioni testate |
| **% Lines** | Percentuale di righe eseguite | `96.77%` = 30 su 31 righe |
| **Uncovered Line #s** | Numeri di riga NON coperti | `145,289` = righe 145 e 289 non testate |

### Report HTML Interattivo

Il report HTML (`coverage/lcov-report/index.html`) offre:

- **Vista globale**: panoramica di tutti i file con percentuali colorate
- **Drill-down**: clicca su un file per vedere il codice sorgente
- **Highlight visivo**:
  - 🟢 Verde = codice coperto
  - 🔴 Rosso = codice NON coperto
  - 🟡 Giallo = rami parzialmente coperti
- **Dettagli branch**: mostra quali rami if/else sono stati testati

#### Esempio di codice nel report HTML:

```javascript
// 🟢 Linea coperta (verde)
1 | export function validateEmail(email) {
2 |   if (!email) {                    // 🟡 Branch parziale (giallo)
3 |     return false;                   // 🟢 Coperto
4 |   }
5 |   return email.includes('@');       // 🔴 Mai eseguito (rosso)
6 | }
```

---

## 📊 Le 4 Metriche di Coverage

Jest misura 4 aspetti diversi del code coverage. Capirle è fondamentale.

### 1. Lines Coverage (Copertura Righe)

**Cosa misura**: Quante righe di codice sono state eseguite durante i test.

**Esempio**:

```javascript
function calcolaSconto(prezzo, isPremium) {
  let sconto = 0;                    // ✅ Riga 1 eseguita

  if (isPremium) {                   // ✅ Riga 2 eseguita
    sconto = prezzo * 0.2;           // ❌ Riga 3 MAI eseguita
  }

  return prezzo - sconto;            // ✅ Riga 4 eseguita
}

// Test
calcolaSconto(100, false);  // Testa solo il caso non-premium
```

**Risultato**: `75% Lines Coverage` (3 righe su 4 eseguite)

**Riga mancante**: La riga 3 (`sconto = prezzo * 0.2`) non è mai stata eseguita perché non abbiamo testato il caso `isPremium = true`.

### 2. Statements Coverage (Copertura Istruzioni)

**Cosa misura**: Quanti statement JavaScript sono stati eseguiti.

**Differenza con Lines**: Una riga può contenere più statement.

**Esempio**:

```javascript
// Una riga, TRE statements
const x = 10, y = 20, z = 30;  // Statement 1, 2, 3

// Due statement sulla stessa riga
if (x > 5) return true; else return false;  // Statement 1, 2

// Operatore ternario = 3 statement
const result = condition ? value1 : value2;  // Condition, value1, value2
```

**Test case**:

```javascript
function processData(data) {
  const cleaned = data.trim(), normalized = data.toLowerCase();  // 2 statements
  return normalized;
}

// Test che esegue la funzione
processData("  TEST  ");
```

**Risultato**: `100% Statements` (entrambi gli statement eseguiti), `100% Lines` (una sola riga).

### 3. Branches Coverage (Copertura Rami)

**Cosa misura**: Quanti percorsi condizionali (if/else, switch, ternary, &&, ||) sono stati testati.

**Esempio 1 - If/Else**:

```javascript
function getStatus(age) {
  if (age >= 18) {           // Branch 1: true, Branch 2: false
    return "adulto";
  } else {
    return "minorenne";
  }
}

// Test solo per adulti
test('adulto', () => {
  expect(getStatus(25)).toBe("adulto");  // ✅ Branch true coperto
});
// ❌ Branch false NON coperto
```

**Risultato**: `50% Branches` (1 su 2 rami testati)

**Esempio 2 - Operatore Ternario**:

```javascript
const message = isLoggedIn ? "Welcome" : "Login";  // 2 branches
```

**Esempio 3 - Short-circuit (&&, ||)**:

```javascript
// 2 branches: user esiste? user.name esiste?
const name = user && user.name;

// 2 branches: value è truthy? usa default
const result = value || defaultValue;
```

**Esempio 4 - Switch**:

```javascript
function getColor(status) {
  switch(status) {           // 4 branches (3 case + default)
    case 'success':
      return 'green';
    case 'error':
      return 'red';
    case 'warning':
      return 'yellow';
    default:
      return 'gray';
  }
}
```

### 4. Functions Coverage (Copertura Funzioni)

**Cosa misura**: Quante funzioni sono state chiamate almeno una volta.

**Esempio**:

```javascript
// functions/api/clienti.js
export function createCliente(data) {     // ✅ Chiamata nel test
  return { id: 1, ...data };
}

export function updateCliente(id, data) { // ✅ Chiamata nel test
  return { id, ...data };
}

export function deleteCliente(id) {       // ❌ MAI chiamata
  return { deleted: true };
}

export function getClienteStats(id) {     // ❌ MAI chiamata
  return { views: 100 };
}
```

**Risultato**: `50% Functions` (2 su 4 funzioni chiamate)

**Fix**: Aggiungere test per `deleteCliente` e `getClienteStats`.

---

## 🎯 Soglie di Coverage del Progetto

Le soglie sono configurate in `jest.config.js` e definiscono i **minimi obbligatori**.

### Soglie Globali

```javascript
coverageThreshold: {
  global: {
    branches: 80,      // 80% di tutti i rami testati
    functions: 80,     // 80% di tutte le funzioni chiamate
    lines: 80,         // 80% di tutte le righe eseguite
    statements: 80     // 80% di tutti gli statement eseguiti
  }
}
```

Se **anche solo una** metrica scende sotto l'80%, Jest **fallisce** con errore:

```
FAIL  Coverage threshold for branches (75%) not met: 80%
```

### Soglie Specifiche per File Critici

Alcuni file hanno soglie **più alte** perché sono critici:

#### 1. entityFactory.js - 100% Coverage (CRITICO)

```javascript
'./shared/schemas/entityFactory.js': {
  branches: 100,
  functions: 100,
  lines: 100,
  statements: 100
}
```

**Perché 100%?**
- Codice condiviso da tutte le entità
- Ogni bug impatta multiple funzionalità
- Factory pattern richiede test completi

#### 2. clienti.js - 95% Coverage (API PRINCIPALE)

```javascript
'./functions/api/clienti.js': {
  branches: 95,
  functions: 95,
  lines: 95,
  statements: 95
}
```

**Perché 95%?**
- Template di riferimento per altre API
- Funzionalità CRUD complete
- Alta criticità business

#### 3. authHelpers.js - 90% Coverage (SICUREZZA)

```javascript
'./functions/utils/authHelpers.js': {
  branches: 90,
  functions: 90,
  lines: 90,
  statements: 90
}
```

**Perché 90%?**
- Gestisce autenticazione e autorizzazione
- Bug = vulnerabilità di sicurezza
- Codice complesso con molti edge case

#### 4. auditLogger.js - 85% Coverage (TRACCIABILITÀ)

```javascript
'./functions/utils/auditLogger.js': {
  branches: 85,
  functions: 85,
  lines: 85,
  statements: 85
}
```

**Perché 85%?**
- Tracciamento modifiche per compliance
- Importante ma meno critico
- Alcuni edge case difficili da testare

### Tabella Riepilogativa Soglie

| File | Soglia | Criticità | Motivazione |
|------|--------|-----------|-------------|
| `entityFactory.js` | 100% | 🔴 MASSIMA | Codice condiviso, impatto globale |
| `clienti.js` | 95% | 🟠 ALTA | Template API, riferimento |
| `authHelpers.js` | 90% | 🟠 ALTA | Sicurezza, autenticazione |
| `auditLogger.js` | 85% | 🟡 MEDIA | Tracciabilità, compliance |
| **Tutti gli altri** | 80% | 🟢 NORMALE | Baseline progetto |

---

## 📁 File Inclusi ed Esclusi

### File INCLUSI nel Coverage

```javascript
collectCoverageFrom: [
  'shared/**/*.js',           // ✅ Schemas e utilities condivise
  'functions/api/**/*.js',    // ✅ Cloud Functions API
  'functions/utils/**/*.js',  // ✅ Utilities Cloud Functions
  'src/scripts/**/*.js',      // ✅ Scripts frontend
  // ...
]
```

### File ESCLUSI dal Coverage

```javascript
collectCoverageFrom: [
  // ...
  '!**/node_modules/**',        // ❌ Dipendenze terze parti
  '!**/tests/**',               // ❌ Test stessi
  '!**/*.test.js',              // ❌ File di test
  '!**/coverage/**',            // ❌ Report coverage precedenti
  '!**/dist/**',                // ❌ Build artifacts
  '!**/.astro/**',              // ❌ Cache Astro
  '!**/scripts/sync-*.js',      // ❌ Script utility non critici
  '!**/scripts/generate-*.cjs', // ❌ Script generatori
  '!functions/index.js',        // ❌ Export functions (solo export)
  '!**/config.js',              // ❌ File configurazione
  '!**/*.config.js',            // ❌ Altri config
]
```

### Perché questi file sono esclusi?

| File Escluso | Motivo |
|--------------|--------|
| `node_modules/` | Codice di terze parti già testato |
| `tests/` e `*.test.js` | Non ha senso testare i test stessi |
| `coverage/` | Report generati, non codice sorgente |
| `dist/` e `.astro/` | Artefatti di build, non codice originale |
| `scripts/sync-*.js` | Script utility manuali, bassa criticità |
| `functions/index.js` | Solo exports, nessuna logica business |
| `*.config.js` | Configurazione, non logica applicativa |

---

## 🚦 Come Interpretare i Risultati

### Livelli di Coverage

| Coverage | Stato | Azione |
|----------|-------|--------|
| **90-100%** | 🟢 ECCELLENTE | Mantieni questo livello |
| **80-89%** | 🟡 BUONO | Ok, ma puoi migliorare |
| **70-79%** | 🟠 SUFFICIENTE | Aggiungi test per codice critico |
| **< 70%** | 🔴 INSUFFICIENTE | Priorità alta: aumenta coverage |

### Esempi di Interpretazione

#### Caso 1: Coverage Globale Alto, File Specifico Basso

```
All files           |   85.00 |    82.00 |   87.00 |   85.00 |
 validator.js       |   45.00 |    30.00 |   50.00 |   45.00 | 23-89,112-156
```

**Problema**: `validator.js` ha coverage bassissimo (45%).

**Azione**:
1. Apri `coverage/lcov-report/validator.js.html`
2. Identifica righe rosse (23-89, 112-156)
3. Scrivi test specifici per quelle funzioni
4. Focus su branches (30% è critico)

#### Caso 2: High Lines, Low Branches

```
authHelpers.js      |   95.00 |    65.00 |   90.00 |   95.00 |
```

**Problema**: Righe coperte (95%) ma branches bassi (65%).

**Causa**: Test solo per "happy path", mancano edge cases.

**Esempio**:

```javascript
function checkPermission(user, resource) {
  if (!user) return false;           // ❌ Branch false non testato
  if (!user.isActive) return false;  // ❌ Branch true non testato
  if (!resource) return false;       // ❌ Branch false non testato
  return user.permissions.includes(resource);
}

// Test esistente (testa solo happy path)
test('user con permesso', () => {
  const user = { isActive: true, permissions: ['read'] };
  expect(checkPermission(user, 'read')).toBe(true);
});
```

**Fix**: Aggiungi test per tutti i casi:

```javascript
test('user null', () => {
  expect(checkPermission(null, 'read')).toBe(false);
});

test('user non attivo', () => {
  const user = { isActive: false, permissions: ['read'] };
  expect(checkPermission(user, 'read')).toBe(false);
});

test('resource null', () => {
  const user = { isActive: true, permissions: ['read'] };
  expect(checkPermission(user, null)).toBe(false);
});

test('user senza permesso', () => {
  const user = { isActive: true, permissions: [] };
  expect(checkPermission(user, 'read')).toBe(false);
});
```

#### Caso 3: Functions Coverage Basso

```
utils/helpers.js    |   80.00 |    75.00 |   50.00 |   80.00 |
```

**Problema**: Solo 50% delle funzioni sono chiamate.

**Causa**: Funzioni utility mai usate nei test.

**Fix**:

```javascript
// Identifica funzioni non testate
// Apri coverage/lcov-report/helpers.js.html
// Cerca funzioni senza highlight verde

// Esempio: funzione mai chiamata
export function formatCurrency(amount) {  // ❌ 0 volte chiamata
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

// Aggiungi test
test('formatCurrency', () => {
  expect(formatCurrency(1000)).toBe('€1.000,00');
  expect(formatCurrency(0)).toBe('€0,00');
  expect(formatCurrency(-500)).toBe('-€500,00');
});
```

---

## 🔧 Workflow per Migliorare Coverage

### Step 1: Identifica il Problema

```bash
npm run test:coverage
```

Output:

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
 validator.js       |   65.21 |    61.53 |   66.66 |   65.21 | 23-45,78-90
--------------------|---------|----------|---------|---------|-------------------
```

**Problema identificato**: `validator.js` sotto soglia 80%.

### Step 2: Apri Report HTML

```bash
npm run test:coverage:html
```

Apre automaticamente `coverage/lcov-report/index.html` nel browser.

1. Cerca `validator.js` nella lista
2. Clicca sul file
3. Analizza codice colorato:
   - 🔴 Rosso = codice non coperto
   - 🟡 Giallo = branches parziali
   - 🟢 Verde = tutto ok

### Step 3: Analizza Codice Non Coperto

Esempio da `validator.js`:

```javascript
23  | export function validatePhone(phone) {
24  |   if (!phone) return { valid: false, error: 'Required' };  // 🟡 Branch parziale
25  |
26  |   const cleaned = phone.replace(/\D/g, '');                // 🔴 Mai eseguito
27  |
28  |   if (cleaned.length < 10) {                               // 🔴 Mai eseguito
29  |     return { valid: false, error: 'Too short' };           // 🔴 Mai eseguito
30  |   }
31  |
32  |   return { valid: true };                                  // 🟢 Coperto
33  | }
```

**Analisi**:
- Riga 24: Testato solo caso `phone` presente, non assente
- Righe 26-30: Mai testate (nessun test chiama questa funzione)
- Riga 32: Coperta dai test esistenti

### Step 4: Scrivi Test Mancanti

```javascript
// tests/unit/validator.test.js

describe('validatePhone', () => {

  // Test 1: Happy path (già esistente)
  test('numero valido', () => {
    expect(validatePhone('1234567890')).toEqual({ valid: true });
  });

  // Test 2: Campo vuoto (branch mancante)
  test('campo vuoto', () => {
    expect(validatePhone('')).toEqual({
      valid: false,
      error: 'Required'
    });
  });

  // Test 3: Campo null
  test('campo null', () => {
    expect(validatePhone(null)).toEqual({
      valid: false,
      error: 'Required'
    });
  });

  // Test 4: Numero troppo corto (righe 28-30)
  test('numero troppo corto', () => {
    expect(validatePhone('123')).toEqual({
      valid: false,
      error: 'Too short'
    });
  });

  // Test 5: Numero con formattazione (riga 26)
  test('numero con trattini e spazi', () => {
    expect(validatePhone('123-456-7890')).toEqual({ valid: true });
  });
});
```

### Step 5: Verifica Miglioramento

```bash
npm run test:coverage
```

Output:

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
 validator.js       |   95.65 |    94.11 |  100.00 |   95.65 | 67
--------------------|---------|----------|---------|---------|-------------------
```

**Risultato**: Coverage passato da 65% a 95%!

### Step 6: Ripeti per Altri File

```bash
# Identifica prossimo file con coverage basso
npm run test:coverage | grep -v "100.00"
```

---

## 🤖 Come l'AI Usa il Coverage

### Durante lo Sviluppo

Quando chiedi all'AI di aggiungere una feature:

```
User: "Aggiungi validazione email in validator.js"

AI:
1. ✅ Implementa validateEmail()
2. ✅ Scrive test completi (happy path + edge cases)
3. ✅ Esegue npm run test:coverage
4. ✅ Verifica coverage >= 80%
5. ✅ Se coverage < 80%, aggiunge test mancanti
6. ✅ Commit solo quando coverage ok
```

### Analisi Coverage Esistente

```
User: "Perché validator.js ha coverage basso?"

AI:
1. ✅ Legge coverage/lcov-report/validator.js.html
2. ✅ Identifica righe rosse (non coperte)
3. ✅ Analizza quali test mancano
4. ✅ Propone test specifici per coprire quelle righe
5. ✅ Implementa i test
6. ✅ Verifica aumento coverage
```

### Refactoring Sicuro

```
User: "Refactorizza authHelpers.js per migliorare performance"

AI:
1. ✅ Esegue coverage PRIMA del refactoring (baseline)
2. ✅ Refactorizza il codice
3. ✅ Esegue test: devono passare tutti
4. ✅ Esegue coverage: DEVE rimanere >= baseline
5. ✅ Se coverage scende, aggiunge test
6. ✅ Commit solo se coverage invariato o aumentato
```

### Prioritizzazione Lavoro

L'AI usa coverage per decidere cosa testare prima:

```javascript
Priority 1: File con coverage < 70%        (CRITICO)
Priority 2: File con branches < 80%        (IMPORTANTE)
Priority 3: File con functions < 80%       (MEDIO)
Priority 4: Migliorare file già > 90%      (BASSA)
```

---

## 🔄 Integrazione CI/CD

### GitHub Actions Example

Crea `.github/workflows/test-coverage.yml`:

```yaml
name: Tests and Coverage

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      # 1. Checkout del codice
      - name: Checkout repository
        uses: actions/checkout@v3

      # 2. Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      # 3. Installa dipendenze
      - name: Install dependencies
        run: npm ci

      # 4. Esegui test con coverage
      - name: Run tests with coverage
        run: npm run test:coverage

      # 5. Verifica soglie coverage
      # (Jest fallisce automaticamente se coverage < threshold)

      # 6. Upload coverage report a Codecov (opzionale)
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: true

      # 7. Commenta PR con coverage (opzionale)
      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}

      # 8. Archive coverage report
      - name: Archive coverage report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: coverage/
          retention-days: 30
```

### Cosa fa questa pipeline:

1. **Trigger**: Esegue su push a `main`/`develop` e su ogni PR
2. **Setup**: Installa Node.js 18 e dipendenze
3. **Test**: Esegue `npm run test:coverage`
4. **Validazione**: Jest fallisce se coverage < soglie configurate
5. **Upload**: Invia report a Codecov (servizio esterno)
6. **PR Comment**: Aggiunge commento con coverage diff nella PR
7. **Archive**: Salva report per 30 giorni

### Risultato in PR:

```
Coverage Report
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   87.23 |    84.61 |   89.47 |   87.23 |
--------------------|---------|----------|---------|---------|

Changes from base branch:
  Lines:      +2.1%  ⬆️
  Branches:   -0.5%  ⬇️
  Functions:  +1.3%  ⬆️
  Statements: +2.0%  ⬆️

✅ All coverage thresholds met!
```

### Badge Coverage nel README

Dopo setup Codecov, aggiungi badge:

```markdown
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

Mostra: ![Coverage: 87%](https://img.shields.io/badge/coverage-87%25-brightgreen)

---

## ✅ Best Practices

### DO (Cosa Fare)

#### 1. Testa Edge Cases, Non Solo Happy Path

```javascript
// ❌ BAD: Solo happy path
test('calcola totale', () => {
  expect(calcolaTotale([10, 20, 30])).toBe(60);
});

// ✅ GOOD: Happy path + edge cases
describe('calcolaTotale', () => {
  test('array con valori positivi', () => {
    expect(calcolaTotale([10, 20, 30])).toBe(60);
  });

  test('array vuoto', () => {
    expect(calcolaTotale([])).toBe(0);
  });

  test('array con valori negativi', () => {
    expect(calcolaTotale([-10, 20])).toBe(10);
  });

  test('array con zero', () => {
    expect(calcolaTotale([0, 0, 0])).toBe(0);
  });

  test('array null', () => {
    expect(() => calcolaTotale(null)).toThrow();
  });
});
```

#### 2. Usa Coverage per Trovare Codice Morto

```javascript
// Codice con funzione mai usata
export function formatDate(date) {
  return date.toISOString();
}

export function formatDateLegacy(date) {  // ❌ 0% coverage
  return date.toString();                 // Codice morto?
}

// Action: Rimuovi formatDateLegacy o documenta perché serve
```

#### 3. Aumenta Coverage Gradualmente

```javascript
// Priorità:
// 1. File critici (entityFactory, authHelpers) -> 90%+
// 2. API endpoints (clienti, note) -> 85%+
// 3. Utils (validator, logger) -> 80%+
// 4. Scripts frontend -> 70%+
```

#### 4. Testa Tutti i Branch

```javascript
// ❌ BAD: Testa solo if, non else
test('user attivo', () => {
  expect(isActive({ status: 'active' })).toBe(true);
});

// ✅ GOOD: Testa entrambi i branch
test('user attivo', () => {
  expect(isActive({ status: 'active' })).toBe(true);
});

test('user inattivo', () => {
  expect(isActive({ status: 'inactive' })).toBe(false);
});
```

#### 5. Esegui Coverage Prima di Commit

```bash
# Nel pre-commit hook (.git/hooks/pre-commit)
#!/bin/bash
npm run test:coverage

if [ $? -ne 0 ]; then
  echo "❌ Coverage check failed. Commit aborted."
  exit 1
fi

echo "✅ Coverage check passed."
```

### DON'T (Cosa NON Fare)

#### 1. NON Scrivere Test Solo per Aumentare Coverage

```javascript
// ❌ BAD: Test inutile che non verifica nulla
test('chiama la funzione', () => {
  getData();  // Nessuna assertion, solo per coverage
});

// ✅ GOOD: Test che verifica comportamento
test('getData restituisce array', () => {
  const result = getData();
  expect(Array.isArray(result)).toBe(true);
  expect(result.length).toBeGreaterThan(0);
});
```

#### 2. NON Mirare a 100% Coverage su Tutto

```javascript
// Alcuni casi sono difficili/impossibili da testare:
// - Codice di gestione errori rari
// - Fallback per browser legacy
// - Logging in produzione

try {
  riskyOperation();
} catch (error) {
  // Questo catch potrebbe non essere testabile
  // in ambiente di test
  if (process.env.NODE_ENV === 'production') {
    sendToSentry(error);  // ❌ Difficile testare
  }
}
```

**Soluzione**: Escludi specifici branch difficili da testare, documentando il perché.

#### 3. NON Ignorare Low Branch Coverage

```javascript
// ❌ BAD: 90% lines ma 50% branches
File          | % Lines | % Branch |
validator.js  |   90.00 |    50.00 |

// Significa: Tanti if/else non testati
// Branch coverage è più importante di line coverage!
```

#### 4. NON Testare Implementazione, Testa Comportamento

```javascript
// ❌ BAD: Test accoppiato all'implementazione
test('usa metodo interno', () => {
  const obj = new MyClass();
  obj.internalMethod();  // Testa dettaglio implementativo
});

// ✅ GOOD: Test che verifica comportamento pubblico
test('salva dati correttamente', () => {
  const obj = new MyClass();
  obj.save({ name: 'test' });
  expect(obj.getData()).toEqual({ name: 'test' });
});
```

#### 5. NON Affidarti Solo al Coverage

```javascript
// ⚠️ WARNING: 100% coverage NON garantisce zero bug

function divide(a, b) {
  return a / b;  // Bug: nessun check per b === 0
}

// Test con 100% coverage ma bug non rilevato
test('divisione', () => {
  expect(divide(10, 2)).toBe(5);  // ✅ Passa, ma non testa edge case
});

// ✅ Test corretto che trova il bug
test('divisione per zero', () => {
  expect(() => divide(10, 0)).toThrow();  // ❌ Fail, bug trovato!
});
```

**Regola**: Coverage alto + test significativi = codice robusto

---

## 📈 Report Coverage Atteso

### Obiettivo Finale

Dopo aver completato tutti i test, il report dovrebbe essere:

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |   87.54 |    85.23 |   89.12 |   87.54 |
 api                |   94.23 |    92.15 |   95.00 |   94.23 |
  clienti.js        |   96.77 |    95.00 |  100.00 |   96.77 | 145,289
  note.js           |   94.11 |    91.66 |   90.00 |   94.11 | 78,156
  prodotti.js       |   92.50 |    90.00 |   95.00 |   92.50 | 234
 schemas            |  100.00 |   100.00 |  100.00 |  100.00 |
  entityFactory.js  |  100.00 |   100.00 |  100.00 |  100.00 |
  noteSchema.js     |  100.00 |   100.00 |  100.00 |  100.00 |
 utils              |   85.32 |    83.45 |   87.50 |   85.32 |
  authHelpers.js    |   91.30 |    88.88 |   90.00 |   91.30 | 45,67
  auditLogger.js    |   87.50 |    85.71 |   87.50 |   87.50 | 112
  validator.js      |   82.61 |    80.00 |   85.00 |   82.61 | 23,45,67
  errorHandler.js   |   80.00 |    78.00 |   83.33 |   80.00 | 34,56,78,90
 scripts            |   75.23 |    72.50 |   78.00 |   75.23 |
  dataSync.js       |   78.00 |    75.00 |   80.00 |   78.00 | 12,34,56
  cacheManager.js   |   72.46 |    70.00 |   76.00 |   72.46 | 45-67,89-112
--------------------|---------|----------|---------|---------|-------------------

Test Suites: 12 passed, 12 total
Tests:       156 passed, 156 total
Snapshots:   0 total
Time:        12.456 s

✅ Coverage thresholds met: All files (87.54% >= 80%)
✅ Coverage thresholds met: entityFactory.js (100% >= 100%)
✅ Coverage thresholds met: clienti.js (96.77% >= 95%)
✅ Coverage thresholds met: authHelpers.js (91.30% >= 90%)
✅ Coverage thresholds met: auditLogger.js (87.50% >= 85%)
```

### Cosa Significa

- **Global**: 87.54% (sopra soglia 80%) ✅
- **File critici**: Tutti sopra soglie specifiche ✅
- **entityFactory.js**: 100% (requisito rispettato) ✅
- **Scripts**: 75% (accettabile per codice meno critico) ✅

### Coverage HTML Report

Aprendo `coverage/lcov-report/index.html` vedrai:

```
📊 Coverage Report - base-app

Total Coverage: 87.54%  🟢

Directory          Coverage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 api/            94.23%  🟢
📁 schemas/       100.00%  🟢
📁 utils/          85.32%  🟢
📁 scripts/        75.23%  🟡

Click on any directory to see detailed file coverage
```

Cliccando su un file, vedi codice evidenziato:

```javascript
  1 🟢 | export function validateEmail(email) {
  2 🟢 |   if (!email) {
  3 🟢 |     return { valid: false, error: 'Required' };
  4 🟢 |   }
  5 🟢 |
  6 🟢 |   const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  7 🟢 |   if (!regex.test(email)) {
  8 🟢 |     return { valid: false, error: 'Invalid format' };
  9 🟢 |   }
 10 🟢 |
 11 🟢 |   return { valid: true };
 12 🟢 | }
```

---

## 📚 File e Risorse Correlate

### File di Configurazione

| File | Percorso | Scopo |
|------|----------|-------|
| Jest Config | `/home/fabio/Work/workspace/firebase/base_app/jest.config.js` | Configurazione coverage e test |
| Package.json | `/home/fabio/Work/workspace/firebase/base_app/package.json` | Script npm per coverage |

### Directory Test

| Directory | Percorso | Contenuto |
|-----------|----------|-----------|
| Unit Tests | `/home/fabio/Work/workspace/firebase/base_app/tests/unit/` | Test unitari |
| Integration Tests | `/home/fabio/Work/workspace/firebase/base_app/tests/integration/` | Test integrazione |
| Coverage Reports | `/home/fabio/Work/workspace/firebase/base_app/coverage/` | Report generati |

### Documentazione Correlata

| Documento | Percorso | Descrizione |
|-----------|----------|-------------|
| Testing Guide | `docs/testing/TESTING.md` | Guida generale testing |
| Test Unitari | `docs/testing/UNIT_TESTS.md` | Guida test unitari |
| Test Integrazione | `docs/testing/INTEGRATION_TESTS.md` | Guida test integrazione |
| Code Coverage | `docs/testing/CODE_COVERAGE.md` | Questo documento |

### Comandi Utili

```bash
# Coverage completo
npm run test:coverage

# Coverage solo unit test
npm run test:coverage:unit

# Coverage con watch mode
npm run test:coverage:watch

# Coverage + apri HTML report
npm run test:coverage:html

# Vedi solo file sotto soglia
npm run test:coverage | grep -v "100.00"

# Coverage di un singolo file
npx jest --coverage --testPathPattern=clienti.test.js
```

### Tool Esterni

| Tool | URL | Scopo |
|------|-----|-------|
| Jest | https://jestjs.io/docs/cli#--coverageboolean | Documentazione coverage Jest |
| Istanbul | https://istanbul.js.org/ | Coverage engine (usato da Jest) |
| Codecov | https://codecov.io/ | Servizio cloud per tracking coverage |
| Coveralls | https://coveralls.io/ | Alternativa a Codecov |
| SonarQube | https://www.sonarqube.org/ | Analisi qualità codice + coverage |

### IDE Integration

#### VS Code Extensions

1. **Jest Runner**: Esegui test con coverage da editor
   ```
   ext install firsttris.vscode-jest-runner
   ```

2. **Coverage Gutters**: Visualizza coverage inline
   ```
   ext install ryanluker.vscode-coverage-gutters
   ```

3. **Jest**: Test explorer + coverage
   ```
   ext install Orta.vscode-jest
   ```

#### WebStorm / IntelliJ IDEA

1. Run Configuration: "Jest with Coverage"
2. View → Tool Windows → Coverage
3. Right-click test → Run with Coverage

---

## 🎓 Conclusioni

### Punti Chiave da Ricordare

1. **Coverage ≠ Qualità**: 100% coverage non garantisce zero bug
2. **Branch Coverage Conta**: Più importante di line coverage
3. **Test Significativi**: Meglio 80% con test robusti che 100% con test inutili
4. **Coverage per File Critici**: Priorità a codice shared e sicurezza
5. **CI/CD Integration**: Automatizza controlli coverage

### Prossimi Passi

1. Esegui `npm run test:coverage`
2. Identifica file sotto 80%
3. Apri report HTML e analizza codice rosso
4. Scrivi test mancanti
5. Verifica miglioramento
6. Ripeti per altri file

### Risorse Aggiuntive

- **Documentazione Jest Coverage**: https://jestjs.io/docs/configuration#collectcoverage-boolean
- **Istanbul Documentation**: https://github.com/istanbuljs/istanbuljs
- **Code Coverage Best Practices**: https://testing.googleblog.com/

---

**Hai domande sul coverage?** Consulta questo documento o chiedi all'AI!

