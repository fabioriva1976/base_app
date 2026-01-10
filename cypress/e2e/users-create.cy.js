describe('Users - creazione', () => {
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

  function findRowByEmail(email) {
    cy.get('input[type="search"], .datatable-input, .dataTable-input', { timeout: 10000 })
      .first()
      .clear()
      .type(email);
    cy.get('#data-table', { timeout: 20000 })
      .contains('td', email)
      .should('be.visible')
      .scrollIntoView();
  }

  it('dovrebbe creare un nuovo utente operatore', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    cy.visit('/login', { failOnStatusCode: false });

    cy.get('#email').type(adminEmail);
    cy.get('#password').type(adminPassword);
    cy.get('#login-btn').click();

    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');

    cy.visit('/users', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const userEmail = `operatore.${Date.now()}@test.local`;

    cy.get('#nome').type('Mario');
    cy.get('#cognome').type('Rossi');
    cy.get('#email').type(userEmail);
    cy.get('#password').type('Password123!');

    cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });
    cy.get('#ruolo-multiselect-hidden').should('have.value', 'operatore');

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('be.visible');
    cy.get('#close-sidebar-btn').click();

    findRowByEmail(userEmail);
  });
});
