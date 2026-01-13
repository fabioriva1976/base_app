# 🧪 Test Permessi Cypress

Test end-to-end per verificare il sistema di controllo permessi basato su ruoli (RBAC).

---

## 📋 Test Implementati

### 1. **permessi/permessi-ruolo-operatore.cy.js**

Verifica permessi per ruolo **OPERATORE**:

**✅ Può accedere a**:
- Dashboard
- Clienti

**❌ NON può accedere a**:
- Utenti → redirect a `/accesso-negato`
- Configurazioni → redirect a `/accesso-negato`

**Test coperti**:
- Link visibili nel menu (2 voci)
- Accesso diretto a rotte protette bloccato
- Pagina "Accesso Negato" mostrata correttamente
- Navigazione tra pagine consentite

---

### 2. **permessi/permessi-ruolo-admin.cy.js**

Verifica permessi per ruolo **ADMIN**:

**✅ Può accedere a**:
- Dashboard
- Clienti
- Utenti

**❌ NON può accedere a**:
- Configurazioni → redirect a `/accesso-negato`

**Test coperti**:
- Link visibili nel menu (3 voci)
- Accesso a pagina Utenti consentito
- Accesso a Configurazioni bloccato
- Navigazione completa tra pagine consentite
- Confronto con ruolo operatore (admin ha più permessi)

---

### 3. **permessi/permessi-ruolo-superuser.cy.js**

Verifica permessi per ruolo **SUPERUSER**:

**✅ Può accedere a**:
- Dashboard
- Clienti
- Utenti
- Configurazioni
- **Tutte le rotte senza limitazioni**

**Test coperti**:
- Tutti i link visibili nel menu (4 voci)
- Accesso completo a tutte le pagine
- Navigazione senza restrizioni
- Nessuna pagina "Accesso Negato" mai mostrata
- Test robustezza (refresh, back/forward)
- Confronto con altri ruoli

---

## 🚀 Come Eseguire i Test

### Prerequisiti

1. **Emulator Firebase in esecuzione**:
   ```bash
   npm run emulator
   ```

2. **App in esecuzione** (dev o preview):
   ```bash
   npm run dev
   # oppure
   npm run preview
   ```

### Eseguire Tutti i Test Permessi

```bash
# Modalità headless (locale)
npm run test:e2e:permessi

# Modalità headless (per Docker)
npm run test:e2e:permessi:headless

# Modalità interattiva (Cypress UI - solo locale, non in Docker)
npm run test:e2e:permessi:ui
```

**In Docker**:
```bash
# Esegui i test di permessi in modalità headless
docker exec cypress_ui npm run test:e2e:permessi:headless

# Oppure esegui un test specifico
docker exec cypress_ui npx cypress run --spec "cypress/e2e/permessi/permessi-ruolo-operatore.cy.js"
```

### Eseguire Test Specifico

```bash
# Solo operatore
npx cypress run --spec "cypress/e2e/permessi/permessi-ruolo-operatore.cy.js"

# Solo admin
npx cypress run --spec "cypress/e2e/permessi/permessi-ruolo-admin.cy.js"

# Solo superuser
npx cypress run --spec "cypress/e2e/permessi/permessi-ruolo-superuser.cy.js"
```

---

## 🛠️ Comandi Cypress Personalizzati

I test utilizzano comandi custom definiti in `cypress/support/commands/auth.js`:

### Login con Ruoli

```javascript
// Login come operatore
cy.loginAsOperatore('operatore@test.com', 'Test123!');

// Login come admin
cy.loginAsAdmin('admin@test.com', 'Test123!');

// Login come superuser
cy.loginAsSuperuser('superuser@test.com', 'Test123!');
```

### Logout

```javascript
cy.logout();
```

### Seed Utenti

```javascript
// Crea utente operatore in Auth + Firestore
cy.seedOperatore('op@test.com', 'password123');

// Crea utente admin
cy.seedAdmin('admin@test.com', 'password123');

// Crea utente superuser
cy.seedSuperuser('super@test.com', 'password123');
```

### Pulizia

```javascript
// Pulisci tutti gli utenti da Auth
cy.clearAllAuthUsers();

// Pulisci tutti gli utenti da Firestore
cy.clearAllUsers();
```

---

## 📊 Matrice Test Coverage

| Test | Operatore | Admin | Superuser |
|------|-----------|-------|-----------|
| **Link Dashboard visibile** | ✅ | ✅ | ✅ |
| **Link Clienti visibile** | ✅ | ✅ | ✅ |
| **Link Utenti visibile** | ❌ | ✅ | ✅ |
| **Link Configurazioni visibile** | ❌ | ❌ | ✅ |
| **Accesso a /dashboard** | ✅ | ✅ | ✅ |
| **Accesso a /anagrafica-clienti** | ✅ | ✅ | ✅ |
| **Accesso a /users** | ❌ (403) | ✅ | ✅ |
| **Accesso a /configurazioni** | ❌ (403) | ❌ (403) | ✅ |
| **Pagina Accesso Negato mostrata** | ✅ | ✅ | ❌ |
| **Numero voci menu** | 2 | 3 | 4 |

---

## 🔍 Struttura Test

Ogni test suite segue questa struttura:

```javascript
describe('Permessi Ruolo [RUOLO]', () => {
  beforeEach(() => {
    // Login con ruolo specifico
    cy.loginAs[Ruolo]('email@test.com', 'password');
  });

  afterEach(() => {
    cy.logout();
  });

  describe('Verifica Link Menu', () => {
    // Test per verificare quali link sono visibili
  });

  describe('Verifica Accesso Negato', () => {
    // Test per verificare redirect a /accesso-negato
  });

  describe('Verifica Accesso Consentito', () => {
    // Test per verificare accesso a pagine permesse
  });

  describe('Test Aggiuntivi', () => {
    // Test di navigazione, confronti, robustezza
  });
});
```

---

## ⚙️ Configurazione

### package.json

Aggiungi script per eseguire solo test permessi:

```json
{
  "scripts": {
    "test:e2e:permessi": "cypress run --spec \"cypress/e2e/permessi-*.cy.js\"",
    "test:e2e:permessi:ui": "cypress open --e2e --browser chrome"
  }
}
```

### cypress.config.js

Assicurati che la configurazione Cypress punti ai giusti endpoint:

```javascript
{
  env: {
    FIREBASE_API_KEY: 'your-api-key',
    FIREBASE_PROJECT_ID: 'base-app-12108',
    FIREBASE_AUTH_EMULATOR_URL: 'http://localhost:9099',
    FIRESTORE_EMULATOR_URL: 'http://localhost:8080'
  }
}
```

---

## 🐛 Troubleshooting

### ❌ Errore: `test:e2e:permessi:ui` non funziona in Docker

**Problema**: `docker exec cypress_ui npm run test:e2e:permessi:ui` fallisce perché tenta di aprire l'interfaccia grafica

**Soluzione**: Usa la modalità headless invece:
```bash
docker exec cypress_ui npm run test:e2e:permessi:headless
```

L'UI di Cypress richiede X11 e non è compatibile con container Docker standard. Per vedere i test visivamente, eseguili in locale:
```bash
npm run test:e2e:permessi:ui
```

### Test fallisce con timeout

**Problema**: `cy.url().should('include', '/dashboard')` timeout

**Soluzione**:
1. Verifica che gli emulator Firebase siano in esecuzione
2. Verifica che l'app sia in esecuzione su `http://localhost:4321`
3. Aumenta timeout: `cy.url().should('include', '/dashboard', { timeout: 15000 })`

### Utente non ha permessi corretti

**Problema**: Utente admin non vede link "Utenti"

**Soluzione**:
1. Verifica che `cy.seedAdmin()` crei correttamente il ruolo in Firestore
2. Controlla che il middleware legga correttamente il ruolo
3. Pulisci cache: `cy.clearAllAuthUsers()` e `cy.clearAllUsers()`

### Pagina "Accesso Negato" non appare

**Problema**: Redirect a dashboard invece di `/accesso-negato`

**Soluzione**:
1. Verifica che il middleware reindirizzi a `/accesso-negato` (non `/dashboard`)
2. Controlla file: `src/middleware/index.ts` linea redirect
3. Verifica che la rotta `/accesso-negato` sia nei `publicPaths`

---

## 📚 Documentazione Correlata

- [PERMISSIONS.md](../../docs/architecture/PERMISSIONS.md) - Architettura sistema permessi
- [shared/utils/permissions.ts](../../shared/utils/permissions.ts) - Helper permessi
- [src/middleware/index.ts](../../src/middleware/index.ts) - Middleware protezione rotte
- [src/components/Sidebar.astro](../../src/components/Sidebar.astro) - Menu dinamico

---

## ✅ Checklist Pre-Deploy

Prima di deployare in produzione, verifica che tutti i test passino:

- [ ] `permessi/permessi-ruolo-operatore.cy.js` → Tutti i test verdi
- [ ] `permessi/permessi-ruolo-admin.cy.js` → Tutti i test verdi
- [ ] `permessi/permessi-ruolo-superuser.cy.js` → Tutti i test verdi
- [ ] Nessun falso positivo (utenti vedono pagine che non dovrebbero)
- [ ] Nessun falso negativo (utenti bloccati da pagine che dovrebbero vedere)
- [ ] Pagina "Accesso Negato" ha design corretto e link funzionanti

---

**Data ultimo aggiornamento**: 2026-01-12
**Revisione**: v1.0
**Status**: Test implementati e pronti ✅
