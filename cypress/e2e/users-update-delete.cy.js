describe('Users - update e delete', () => {
  const apiKey = 'AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s';
  const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'base-app-12108';
  const authEmulatorUrl = 'http://localhost:9099';
  const firestoreEmulatorUrl = 'http://localhost:8080';

  function findRowByEmail(email) {
    cy.get('input[type="search"], .datatable-input, .dataTable-input', { timeout: 10000 })
      .first()
      .clear()
      .type(email, { delay: 0 });
    cy.get('#data-table', { timeout: 20000 })
      .contains('td', email, { timeout: 20000 })
      .should('exist');
  }

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

  function login(email, password) {
    cy.visit('/login', { failOnStatusCode: false });
    cy.get('#email').clear().type(email);
    cy.get('#password').clear().type(password);
    cy.get('#login-btn').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  }

  function typeInto(selector, value) {
    cy.get(selector).clear();
    cy.get(selector).type(value, { delay: 0 });
  }

  it('dovrebbe aggiornare un utente e mostrare le azioni', () => {
    const adminEmail = `admin.update.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    login(adminEmail, adminPassword);

    cy.visit('/users', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const userEmail = `operatore.update.${Date.now()}@test.local`;

    typeInto('#nome', 'Mario');
    typeInto('#cognome', 'Rossi');
    typeInto('#email', userEmail);
    typeInto('#password', 'Password123!');
    cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    // Verifica azioni dopo la creazione
    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list', { timeout: 10000 }).contains('Creazione').should('be.visible');

    // Aggiorna dati utente
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#close-sidebar-btn').click();
    findRowByEmail(userEmail);
    cy.get('#data-table').contains('td', userEmail).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    typeInto('#nome', 'Luca');
    typeInto('#cognome', 'Bianchi');
    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('button[type="submit"][form="entity-form"]').should('be.disabled');
    cy.get('button[type="submit"][form="entity-form"]', { timeout: 10000 }).should('not.be.disabled');

    // Riapri per caricare lo storico azioni aggiornato
    cy.get('#close-sidebar-btn').click();
    findRowByEmail(userEmail);
    cy.get('#data-table').contains('td', userEmail).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list').contains('Modifica', { timeout: 10000 }).should('be.visible');
  });

  it('dovrebbe eliminare un utente creato', () => {
    const adminEmail = `admin.delete.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    login(adminEmail, adminPassword);

    cy.visit('/users', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const userEmail = `operatore.delete.${Date.now()}@test.local`;

    typeInto('#nome', 'Elisa');
    typeInto('#cognome', 'Verdi');
    typeInto('#email', userEmail);
    typeInto('#password', 'Password123!');
    cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#close-sidebar-btn').click();
    findRowByEmail(userEmail);
    cy.get('#data-table').contains('td', userEmail).closest('tr').within(() => {
      cy.get('.btn-delete').click();
    });

    cy.get('.btn-confirm-yes').click();

    cy.get('input[type="search"], .datatable-input, .dataTable-input', { timeout: 10000 })
      .first()
      .clear()
      .type(userEmail, { delay: 0 });
    cy.get('#data-table', { timeout: 10000 }).contains(userEmail).should('not.exist');
  });
});
