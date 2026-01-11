/**
 * Comandi Cypress per l'autenticazione e gestione utenti
 */

const apiKey = Cypress.env('FIREBASE_API_KEY') || 'AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s';
const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'base-app-12108';
const authEmulatorUrl = Cypress.env('FIREBASE_AUTH_EMULATOR_URL') || 'http://localhost:9099';
const firestoreEmulatorUrl = Cypress.env('FIRESTORE_EMULATOR_URL') || 'http://localhost:8080';

/**
 * Crea un utente in Firebase Auth
 */
Cypress.Commands.add('createAuthUser', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    timeout: 30000,
    retryOnNetworkFailure: true,
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

/**
 * Imposta il ruolo di un utente in Firestore
 * Usa REST API standard (più veloce dell'emulator endpoint)
 */
Cypress.Commands.add('setUserRole', (uid, role, idToken, email) => {
  const now = new Date().toISOString();
  return cy.request({
    method: 'PATCH',
    url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    headers: {
      Authorization: `Bearer ${idToken}`
    },
    timeout: 30000,
    retryOnNetworkFailure: true,
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

/**
 * Imposta custom claims per un utente
 */
Cypress.Commands.add('setCustomClaims', (uid, claims) => {
  return cy.request({
    method: 'POST',
    url: `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
    timeout: 30000,
    retryOnNetworkFailure: true,
    body: {
      localId: uid,
      customAttributes: JSON.stringify(claims)
    },
    failOnStatusCode: false
  });
});

/**
 * Crea un utente completo (Auth + Firestore + Custom Claims)
 */
Cypress.Commands.add('seedUser', (email, password, role) => {
  return cy.createAuthUser(email, password).then(({ uid, idToken }) => {
    return cy.setCustomClaims(uid, { role }).then(() => {
      return cy.setUserRole(uid, role, idToken, email).then(() => ({
        uid,
        idToken,
        email,
        role
      }));
    });
  });
});

/**
 * Crea un utente solo in Auth con custom claims (VELOCE - non tocca Firestore)
 * Utile per test dove l'app creerà il profilo Firestore al primo accesso
 */
Cypress.Commands.add('seedAuthOnlyUser', (email, password, role) => {
  return cy.createAuthUser(email, password).then(({ uid, idToken }) => {
    return cy.setCustomClaims(uid, { role }).then(() => ({
      uid,
      idToken,
      email,
      role
    }));
  });
});

/**
 * Crea un utente admin
 */
Cypress.Commands.add('seedAdmin', (email, password) => {
  return cy.seedUser(email, password, 'admin');
});

/**
 * Crea un utente operatore
 */
Cypress.Commands.add('seedOperatore', (email, password) => {
  return cy.seedUser(email, password, 'operatore');
});

/**
 * Crea un utente superuser
 */
Cypress.Commands.add('seedSuperuser', (email, password) => {
  return cy.seedUser(email, password, 'superuser');
});

/**
 * Crea admin solo in Auth (VELOCE - senza Firestore)
 */
Cypress.Commands.add('seedAuthOnlyAdmin', (email, password) => {
  return cy.seedAuthOnlyUser(email, password, 'admin');
});

/**
 * Elimina tutti gli utenti dalla collection users
 */
Cypress.Commands.add('clearAllUsers', () => {
  return cy.request({
    method: 'DELETE',
    url: `${firestoreEmulatorUrl}/emulator/v1/projects/${projectId}/databases/(default)/documents/users`,
    failOnStatusCode: false
  });
});

/**
 * Effettua il login tramite form
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login', { failOnStatusCode: false });
  cy.typeInto('#email', email);
  cy.typeInto('#password', password);
  cy.get('#login-btn').click();
  cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
});
