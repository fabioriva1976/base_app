describe('Users - UI e Sidebar', () => {
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

  function login(email, password) {
    cy.visit('/login', { failOnStatusCode: false });
    cy.get('#email').clear().type(email);
    cy.get('#password').clear().type(password);
    cy.get('#login-btn').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  }

  function findRowByEmail(email) {
    cy.get('input[type="search"], .datatable-input, .dataTable-input', { timeout: 10000 })
      .first()
      .clear()
      .type(email);
    cy.get('#data-table', { timeout: 10000 })
      .contains('td', email)
      .should('be.visible')
      .scrollIntoView();
  }

  const credentials = {
    email: `admin.users.ui.${Date.now()}@test.local`,
    password: 'AdminPass123!'
  };

  before(() => {
    createAuthUser(credentials.email, credentials.password)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, credentials.email));
  });

  beforeEach(() => {
    login(credentials.email, credentials.password);
    cy.visit('/users', { failOnStatusCode: false });
  });

  describe('Tabella', () => {
    it('dovrebbe visualizzare le colonne corrette', () => {
      cy.get('#data-table').scrollIntoView().should('be.visible');
      cy.get('#data-table').contains('th', 'Nome').should('be.visible');
      cy.get('#data-table').contains('th', 'Cognome').should('be.visible');
      cy.get('#data-table').contains('th', 'Email').should('be.visible');
      cy.get('#data-table').contains('th', 'Ruolo').should('be.visible');
      cy.get('#data-table').contains('th', 'Status').should('be.visible');
      cy.get('#data-table').contains('th', 'Azioni').scrollIntoView().should('be.visible');
    });

    it('dovrebbe avere il pulsante Nuovo Utente', () => {
      cy.get('#new-entity-btn').should('be.visible');
      cy.get('#new-entity-btn').should('contain', 'Nuovo Utente');
    });

    it('dovrebbe filtrare i risultati con la ricerca', () => {
      cy.get('#new-entity-btn').click();

      const userEmail = `search.${Date.now()}@test.local`;
      cy.get('#nome').type('Ricerca');
      cy.get('#cognome').type('Utente');
      cy.get('#email').type(userEmail);
      cy.get('#password').type('Password123!');
      cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#save-message', { timeout: 10000 }).should('be.visible');
      cy.get('#close-sidebar-btn').click();

      findRowByEmail(userEmail);
      cy.get('#data-table').contains('td', userEmail).should('be.visible');
    });
  });

  describe('Sidebar - Apertura e Chiusura', () => {
    it('dovrebbe aprire la sidebar al click su Nuovo Utente', () => {
      cy.get('#entity-form-sidebar').should('not.have.class', 'open');
      cy.get('#new-entity-btn').click();
      cy.get('#entity-form-sidebar').should('have.class', 'open');
    });

    it('dovrebbe mostrare il titolo "Nuovo Utente"', () => {
      cy.get('#new-entity-btn').click();
      cy.get('#entity-form-title').should('contain', 'Nuovo Utente');
    });

    it('dovrebbe chiudere la sidebar con il bottone X', () => {
      cy.get('#new-entity-btn').click();
      cy.get('#entity-form-sidebar').should('have.class', 'open');
      cy.get('#close-sidebar-btn').click();
      cy.get('#entity-form-sidebar').should('not.have.class', 'open');
    });

    it('dovrebbe cambiare titolo quando si modifica un utente', () => {
      cy.get('#new-entity-btn').click();

      const userEmail = `title.${Date.now()}@test.local`;
      const fullName = 'Titolo Utente';
      cy.get('#nome').type('Titolo');
      cy.get('#cognome').type('Utente');
      cy.get('#email').type(userEmail);
      cy.get('#password').type('Password123!');
      cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#save-message', { timeout: 10000 }).should('be.visible');
      cy.get('#close-sidebar-btn').click();

      findRowByEmail(userEmail);
      cy.get('#data-table').contains('td', userEmail).closest('tr').within(() => {
        cy.get('.btn-edit').click();
      });

      cy.get('#entity-form-title').should('contain', fullName);
    });
  });

  describe('Sidebar - Tab per Nuovo Utente', () => {
    it('dovrebbe nascondere il tab Azioni per nuovo utente', () => {
      cy.get('#new-entity-btn').click();
      cy.get('[data-tab="anagrafica"]').should('be.visible');
      cy.get('[data-tab="azioni"]').should('not.be.visible');
    });

    it('dovrebbe mostrare il tab Azioni per utente esistente', () => {
      cy.get('#new-entity-btn').click();

      const userEmail = `tabs.${Date.now()}@test.local`;
      cy.get('#nome').type('Tab');
      cy.get('#cognome').type('Utente');
      cy.get('#email').type(userEmail);
      cy.get('#password').type('Password123!');
      cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

      cy.get('[data-tab="anagrafica"]').should('be.visible');
      cy.get('[data-tab="azioni"]').should('be.visible');
    });
  });

  describe('Sidebar - Navigazione Tab', () => {
    it('dovrebbe cambiare tab al click', () => {
      cy.get('#new-entity-btn').click();

      const userEmail = `nav.${Date.now()}@test.local`;
      cy.get('#nome').type('Nav');
      cy.get('#cognome').type('Utente');
      cy.get('#email').type(userEmail);
      cy.get('#password').type('Password123!');
      cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

      cy.get('#tab-anagrafica').should('have.class', 'active');
      cy.get('[data-tab="anagrafica"]').should('have.class', 'active');

      cy.get('[data-tab="azioni"]').click();
      cy.get('#tab-azioni').should('have.class', 'active');
      cy.get('[data-tab="azioni"]').should('have.class', 'active');
      cy.get('#tab-anagrafica').should('not.have.class', 'active');
    });
  });
});
