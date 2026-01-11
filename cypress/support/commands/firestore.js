/**
 * Comandi Cypress per pulizia Firestore Emulator
 */

const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'base-app-12108';
const firestoreEmulatorUrl = Cypress.env('FIRESTORE_EMULATOR_URL') || 'http://localhost:8080';

/**
 * Elimina tutti i documenti di una collection
 * @param {string} collection - Nome della collection
 */
Cypress.Commands.add('clearCollection', (collection) => {
  return cy.request({
    method: 'DELETE',
    url: `${firestoreEmulatorUrl}/emulator/v1/projects/${projectId}/databases/(default)/documents/${collection}`,
    failOnStatusCode: false
  });
});

/**
 * Elimina tutti i clienti
 */
Cypress.Commands.add('clearAllClienti', () => {
  return cy.clearCollection('anagrafica_clienti');
});
