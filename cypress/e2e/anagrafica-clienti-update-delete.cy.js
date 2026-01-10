describe('Anagrafica Clienti - update e delete', () => {
  const apiKey = 'AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s';
  const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'base-app-12108';
  const authEmulatorUrl = 'http://localhost:9099';
  const firestoreEmulatorUrl = 'http://localhost:8080';

  function findRowByCode(code) {
    cy.get('input[type="search"], .datatable-input, .dataTable-input', { timeout: 10000 })
      .first()
      .clear()
      .type(code);
    cy.get('#data-table', { timeout: 20000 })
      .contains('td', code)
      .should('be.visible')
      .scrollIntoView();
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

  it('dovrebbe aggiornare un cliente e mostrare le azioni', () => {
    const adminEmail = `admin.update.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-UPD-${Date.now()}`;
    const emailCliente = `cliente.update.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Azienda Originale SRL');
    cy.get('#email').type(emailCliente);
    cy.get('#piva').type('11111111111');
    cy.get('#telefono').type('+39 333 1111111');

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('be.visible');

    // Verifica azioni dopo la creazione
    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list', { timeout: 10000 }).contains('Creazione').should('be.visible');

    // Aggiorna dati cliente
    cy.get('#close-sidebar-btn').click();
    cy.reload();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/anagrafica-clienti');
    findRowByCode(codiceCliente);
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    cy.get('#ragione_sociale').clear().type('Azienda Modificata SRL');
    cy.get('#piva').clear().type('22222222222');
    cy.get('#telefono').clear().type('+39 333 2222222');
    cy.get('#indirizzo').type('Via Nuova 456');
    cy.get('#citta').type('Roma');
    cy.get('#cap').type('00100');

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('button[type="submit"][form="entity-form"]').should('be.disabled');
    cy.get('button[type="submit"][form="entity-form"]', { timeout: 10000 }).should('not.be.disabled');

    // Riapri per caricare lo storico azioni aggiornato
    cy.get('#close-sidebar-btn').click();
    cy.reload();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/anagrafica-clienti');
    findRowByCode(codiceCliente);
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    // Verifica dati aggiornati
    cy.get('#ragione_sociale').should('have.value', 'Azienda Modificata SRL');
    cy.get('#piva').should('have.value', '22222222222');
    cy.get('#telefono').should('have.value', '+39 333 2222222');
    cy.get('#indirizzo').should('have.value', 'Via Nuova 456');
    cy.get('#citta').should('have.value', 'Roma');
    cy.get('#cap').should('have.value', '00100');

    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list').contains('Modifica', { timeout: 10000 }).should('be.visible');
  });

  it('dovrebbe eliminare un cliente creato', () => {
    const adminEmail = `admin.delete.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-DEL-${Date.now()}`;
    const emailCliente = `cliente.delete.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Azienda da Eliminare SRL');
    cy.get('#email').type(emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('be.visible');
    cy.get('#close-sidebar-btn').click();
    cy.reload();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/anagrafica-clienti');
    findRowByCode(codiceCliente);
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-delete').click();
    });

    cy.get('.btn-confirm-yes').click();

    cy.contains('#data-table', codiceCliente, { timeout: 10000 }).should('not.exist');
  });

  it('dovrebbe annullare la cancellazione di un cliente', () => {
    const adminEmail = `admin.cancel.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-CANCEL-${Date.now()}`;
    const emailCliente = `cliente.cancel.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Azienda Non Eliminare SRL');
    cy.get('#email').type(emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('be.visible');
    cy.get('#close-sidebar-btn').click();
    cy.reload();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/anagrafica-clienti');
    findRowByCode(codiceCliente);
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-delete').click();
    });

    cy.get('.btn-confirm-no').click();

    cy.get('#data-table', { timeout: 10000 }).contains(codiceCliente).should('be.visible');
  });
});
