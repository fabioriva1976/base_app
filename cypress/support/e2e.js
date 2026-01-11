// Cypress support file per test e2e
// Qui puoi aggiungere comandi personalizzati e configurazioni globali

const apiKey = Cypress.env('FIREBASE_API_KEY') || 'AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s';
const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'base-app-12108';
const authEmulatorUrl = Cypress.env('FIREBASE_AUTH_EMULATOR_URL') || 'http://localhost:9099';
const firestoreEmulatorUrl = Cypress.env('FIRESTORE_EMULATOR_URL') || 'http://localhost:8080';

Cypress.Commands.add('createAuthUser', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    body: {
      email,
      password,
      returnSecureToken: true
    },
    failOnStatusCode: false
  }).then((response) => ({
    uid: response.body.localId,
    idToken: response.body.idToken
  }));
});

Cypress.Commands.add('setUserRole', (uid, role, idToken, email) => {
  const now = new Date().toISOString();
  return cy.request({
    method: 'POST',
    url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${uid}`,
    headers: {
      Authorization: `Bearer ${idToken}`
    },
    body: {
      fields: {
        email: { stringValue: email },
        status: { booleanValue: true },
        created: { stringValue: now },
        changed: { stringValue: now },
        lastModifiedBy: { stringValue: uid },
        lastModifiedByEmail: { stringValue: email },
        ruolo: {
          arrayValue: {
            values: [{ stringValue: role }]
          }
        }
      }
    },
    failOnStatusCode: false
  });
});

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login', { failOnStatusCode: false });
  cy.get('#email').clear().type(email);
  cy.get('#password').clear().type(password);
  cy.get('#login-btn').click();
  cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
});

Cypress.Commands.add('searchDataTable', (text) => {
  cy.get('input[type="search"], .datatable-input, .dataTable-input', { timeout: 10000 })
    .first()
    .clear()
    .type(text, { delay: 0 });
});

Cypress.Commands.add('findDataTableRow', (text, options = {}) => {
  const timeout = options.timeout || 20000;
  cy.searchDataTable(text);
  return cy.get('#data-table', { timeout })
    .contains('td', text, { timeout })
    .should('exist');
});

// Esempio: ignorare eccezioni non catturate specifiche
Cypress.on('uncaught:exception', (err, runnable) => {
  // Restituire false previene che Cypress fallisca il test
  // Puoi aggiungere logica per gestire eccezioni specifiche
  return false;
});
