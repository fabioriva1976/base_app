# Cypress Test Suite - Struttura e Convenzioni

Questa directory contiene tutti i test E2E organizzati seguendo best practices per scalabilità e manutenibilità, con particolare attenzione all'estensibilità tramite AI.

## 📁 Struttura Directory

```
cypress/
├── e2e/                          # Test organizzati per feature
│   ├── auth/                     # Test autenticazione
│   │   └── login.cy.js
│   ├── users/                    # Test gestione utenti
│   │   ├── users-create.cy.js
│   │   ├── users-update-delete.cy.js
│   │   ├── users-ui.cy.js
│   │   └── users-create-po.cy.js # Esempio con Page Objects
│   ├── anagrafica-clienti/       # Test gestione clienti
│   │   ├── anagrafica-clienti-create.cy.js
│   │   ├── anagrafica-clienti-update-delete.cy.js
│   │   ├── anagrafica-clienti-ui.cy.js
│   │   └── anagrafica-clienti-create-po.cy.js # Esempio con Page Objects
│   ├── profile/                  # Test profilo utente
│   │   └── profile.cy.js
│   └── settings/                 # Test impostazioni
│       └── settings.cy.js
├── pages/                        # Page Objects
│   ├── BasePage.js              # Classe base con metodi comuni
│   ├── UsersPage.js             # Page Object per users
│   └── AnagraficaClientiPage.js # Page Object per clienti
├── support/
│   ├── commands/                # Custom commands organizzati
│   │   ├── auth.js              # Comandi autenticazione
│   │   ├── table.js             # Comandi tabelle
│   │   └── form.js              # Comandi form
│   ├── utils/                   # Utility functions
│   │   └── firestore.js         # Helper Firestore
│   ├── e2e.js                   # File di configurazione principale
│   └── index.d.ts               # Type definitions TypeScript
├── fixtures/                    # Dati di test
│   └── testData.json            # Dati riutilizzabili
└── README.md                    # Questa documentazione

```

## 🎯 Convenzioni di Naming

### Test Files
- **Pattern**: `<feature>-<operazione>.cy.js`
- **Operazioni standard**:
  - `*-ui.cy.js` - Test UI, sidebar, tabelle, navigazione
  - `*-create.cy.js` - Test creazione entità
  - `*-update-delete.cy.js` - Test modifica ed eliminazione
  - `*-po.cy.js` - Test usando Page Objects (esempi)

### Page Objects
- **Pattern**: `<Feature>Page.js` (PascalCase)
- Esempio: `UsersPage.js`, `AnagraficaClientiPage.js`

### Custom Commands
- **Pattern**: Organizzati per categoria in `support/commands/`
- `auth.js` - Autenticazione e gestione utenti
- `table.js` - Interazione con DataTable
- `form.js` - Manipolazione form

## 🔧 Page Objects

I Page Objects centralizzano selettori e azioni, migliorando manutenibilità e riusabilità.

### Esempio Utilizzo

```javascript
import { UsersPage } from '../../pages/UsersPage.js';

describe('Users - Test', () => {
  const usersPage = new UsersPage();

  it('test esempio', () => {
    usersPage.visitPage();
    usersPage.openNewUserSidebar();
    usersPage.fillUserForm({
      nome: 'Mario',
      cognome: 'Rossi',
      email: 'test@test.local',
      password: 'Password123!',
      ruolo: 'operatore'
    });
    usersPage.submitForm();
    usersPage.waitForSaveComplete();
  });
});
```

### Metodi Comuni BasePage

Tutti i Page Objects ereditano da `BasePage`:
- `visit(path)` - Naviga a una pagina
- `click(selector, options)` - Clicca un elemento
- `typeInto(selector, value)` - Inserisce testo
- `shouldBeVisible(selector)` - Verifica visibilità
- `waitForElement(selector, timeout)` - Attende elemento

## 📦 Fixtures

I dati di test sono centralizzati in `fixtures/testData.json`.

### Esempio Utilizzo

```javascript
cy.fixture('testData').then((testData) => {
  const userData = testData.users.admin;
  // Usa i dati del fixture
});
```

## 🛠️ Custom Commands

### Auth Commands
- `cy.createAuthUser(email, password)` - Crea utente in Firebase Auth
- `cy.seedAdmin(email, password)` - Crea admin completo
- `cy.seedOperatore(email, password)` - Crea operatore completo
- `cy.seedSuperuser(email, password)` - Crea superuser completo
- `cy.login(email, password)` - Login tramite form

### Table Commands
- `cy.searchDataTable(text)` - Cerca nella tabella
- `cy.findDataTableRow(text, options)` - Trova riga nella tabella
- `cy.waitForTableSync(text, options)` - Attende sincronizzazione

### Form Commands
- `cy.typeInto(selector, value)` - Pulisce e inserisce valore

## 🔄 Utilities

### Firestore Utils (`support/utils/firestore.js`)

Funzioni per interagire con Firestore Emulator:
- `setUserProfile(uid, role, idToken, profile)` - Imposta profilo utente
- `getUserFromFirestore(uid, idToken)` - Recupera utente
- `deleteAllUsers()` - Elimina tutti gli utenti
- `getDocument(collection, docId, idToken)` - Recupera documento

Esempio:
```javascript
import { getUserFromFirestore } from '../../support/utils/firestore.js';

cy.then(() => {
  getUserFromFirestore(uid, idToken).then((response) => {
    expect(response.status).to.eq(200);
  });
});
```

## 🤖 Best Practices per AI

Per facilitare l'estensione e la creazione di nuovi test tramite AI:

### 1. Struttura Prevedibile
- Organizza test per feature in directory dedicate
- Usa naming convention consistenti
- Separa test per tipo di operazione (create, update, delete, ui)

### 2. Page Objects
- Crea un Page Object per ogni pagina principale
- Centralizza selettori nel Page Object
- Usa metodi descrittivi (es: `fillUserForm()` invece di `fill()`)

### 3. Riusabilità
- Estrai logica comune in custom commands
- Usa fixtures per dati condivisi
- Crea utilities per operazioni ripetitive

### 4. Documentazione
- Documenta ogni Page Object con JSDoc
- Commenta metodi complessi
- Mantieni README aggiornato

## 📝 Come Aggiungere Nuovi Test

### Opzione 1: Test Tradizionale

1. Crea file in directory appropriata: `cypress/e2e/<feature>/<feature>-<operazione>.cy.js`
2. Usa custom commands per setup
3. Scrivi asserzioni usando selettori diretti

### Opzione 2: Test con Page Objects (Raccomandato)

1. Se necessario, crea/estendi Page Object in `cypress/pages/`
2. Crea test file: `cypress/e2e/<feature>/<feature>-<operazione>-po.cy.js`
3. Importa e usa Page Object
4. Aggiungi spec a `cypress.config.js`

### Esempio Template

```javascript
import { UsersPage } from '../../pages/UsersPage.js';

describe('Users - Nuova Feature', () => {
  const usersPage = new UsersPage();

  beforeEach(() => {
    const email = `admin.${Date.now()}@test.local`;
    cy.seedAdmin(email, 'AdminPass123!');
    cy.login(email, 'AdminPass123!');
    usersPage.visitPage();
  });

  it('dovrebbe fare qualcosa', () => {
    // Il tuo test qui
  });
});
```

## 🚀 Esecuzione Test

```bash
# Tutti i test
docker exec cypress_ui npx cypress run

# Singola spec
docker exec cypress_ui npx cypress run --spec "cypress/e2e/users/users-create.cy.js"

# Feature specifica
docker exec cypress_ui npx cypress run --spec "cypress/e2e/users/*.cy.js"

# UI Mode
docker exec cypress_ui npx cypress open
```

## 🔍 Type Safety

TypeScript definitions in `support/index.d.ts` forniscono autocomplete per custom commands in IDE compatibili (VS Code, WebStorm, etc).

## 📚 Risorse

- [Cypress Documentation](https://docs.cypress.io)
- [Page Object Pattern](https://martinfowler.com/bliki/PageObject.html)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
