describe('Profile', () => {
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

  function setUserProfile(uid, role, idToken, profile) {
    const now = new Date().toISOString();
    return cy.request({
      method: 'POST',
      url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${uid}`,
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      body: {
        fields: {
          email: { stringValue: profile.email },
          nome: { stringValue: profile.nome },
          cognome: { stringValue: profile.cognome },
          telefono: { stringValue: profile.telefono },
          status: { booleanValue: true },
          created: { stringValue: now },
          changed: { stringValue: now },
          lastModifiedBy: { stringValue: uid },
          lastModifiedByEmail: { stringValue: profile.email },
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

  it('dovrebbe caricare i dati profilo da Firestore', () => {
    const email = `admin.profile.${Date.now()}@test.local`;
    const password = 'AdminPass123!';
    const profile = {
      email,
      nome: 'Mario',
      cognome: 'Rossi',
      telefono: '+39 333 0000000'
    };

    createAuthUser(email, password)
      .then(({ uid, idToken }) => setUserProfile(uid, 'admin', idToken, profile));

    login(email, password);
    cy.visit('/profile', { failOnStatusCode: false });

    cy.get('#profile-nome').should('have.value', profile.nome);
    cy.get('#profile-cognome').should('have.value', profile.cognome);
    cy.get('#profile-email').should('have.value', profile.email);
    cy.get('#profile-telefono').should('have.value', profile.telefono);
    cy.get('#profile-ruolo').should('have.value', 'Amministratore');
  });

  it('dovrebbe aggiornare i dati profilo', () => {
    const email = `admin.profile.update.${Date.now()}@test.local`;
    const password = 'AdminPass123!';
    const profile = {
      email,
      nome: 'Anna',
      cognome: 'Verdi',
      telefono: '+39 333 1111111'
    };

    createAuthUser(email, password)
      .then(({ uid, idToken }) => setUserProfile(uid, 'admin', idToken, profile));

    login(email, password);
    cy.visit('/profile', { failOnStatusCode: false });

    cy.get('#profile-nome').focus().type('{selectall}{backspace}Luca');
    cy.get('#profile-cognome').focus().type('{selectall}{backspace}Bianchi');
    cy.get('#profile-telefono').clear().type('+39 333 2222222');

    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.get('#profile-save-message', { timeout: 10000 }).should('be.visible');

    cy.get('#profile-nome').should('have.value', 'Luca');
    cy.get('#profile-cognome').should('have.value', 'Bianchi');
    cy.get('#profile-telefono').should('have.value', '+39 333 2222222');
  });
});
