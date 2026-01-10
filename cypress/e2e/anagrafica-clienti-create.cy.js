describe('Anagrafica Clienti - creazione', () => {
  const apiKey = 'AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s';
  const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'base-app-12108';
  const authEmulatorUrl = 'http://localhost:9099';
  const firestoreEmulatorUrl = 'http://localhost:8080';

  function createAuthUser(email, password) {
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
  }

  function setUserRole(uid, role, idToken, email) {
    const now = new Date().toISOString();
    return cy.request({
      method: 'POST',
      url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${uid}`,
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      body: {
        fields: {
          email: {
            stringValue: email
          },
          status: {
            booleanValue: true
          },
          created: {
            stringValue: now
          },
          changed: {
            stringValue: now
          },
          lastModifiedBy: {
            stringValue: uid
          },
          lastModifiedByEmail: {
            stringValue: email
          },
          ruolo: {
            arrayValue: {
              values: [{ stringValue: role }]
            }
          }
        }
      },
      failOnStatusCode: false
    });
  }

  function findRowByCode(code) {
    cy.get('input[type="search"], .datatable-input, .dataTable-input', { timeout: 10000 })
      .first()
      .clear()
      .type(code);
    cy.get('#data-table', { timeout: 10000 })
      .contains('td', code)
      .should('be.visible')
      .scrollIntoView();
  }

  it('dovrebbe creare un nuovo cliente con campi obbligatori', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    cy.visit('/login', { failOnStatusCode: false });

    cy.get('#email').type(adminEmail);
    cy.get('#password').type(adminPassword);
    cy.get('#login-btn').click();

    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Test SRL');
    cy.get('#email').type(emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('be.visible');
    cy.get('#close-sidebar-btn').click();

    findRowByCode(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Test SRL').should('be.visible');
  });

  it('dovrebbe creare un nuovo cliente con tutti i campi compilati', () => {
    const adminEmail = `admin.full.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    cy.visit('/login', { failOnStatusCode: false });

    cy.get('#email').type(adminEmail);
    cy.get('#password').type(adminPassword);
    cy.get('#login-btn').click();

    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-FULL-${Date.now()}`;
    const emailCliente = `cliente.full.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Azienda Completa SRL');
    cy.get('#piva').type('12345678901');
    cy.get('#cf').type('RSSMRA80A01H501U');
    cy.get('#email').type(emailCliente);
    cy.get('#telefono').type('+39 333 1234567');
    cy.get('#indirizzo').type('Via Roma 123');
    cy.get('#citta').type('Milano');
    cy.get('#cap').type('20100');
    cy.get('#toggle-stato').should('be.checked');

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('be.visible');
    cy.get('#close-sidebar-btn').click();

    findRowByCode(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Azienda Completa SRL').should('be.visible');
    cy.get('#data-table', { timeout: 10000 }).contains('12345678901').should('be.visible');
  });

  it('dovrebbe creare un cliente disattivato', () => {
    const adminEmail = `admin.inactive.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    cy.visit('/login', { failOnStatusCode: false });

    cy.get('#email').type(adminEmail);
    cy.get('#password').type(adminPassword);
    cy.get('#login-btn').click();

    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-INACTIVE-${Date.now()}`;
    const emailCliente = `cliente.inactive.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Cliente Disattivato SRL');
    cy.get('#email').type(emailCliente);
    cy.get('#toggle-stato').uncheck({ force: true });

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('be.visible');
    cy.get('#close-sidebar-btn').click();

    findRowByCode(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Cliente Disattivato SRL').should('be.visible');
  });
});
