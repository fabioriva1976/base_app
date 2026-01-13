/**
 * Utility functions per interagire con Firestore Emulator
 */

const projectId = Cypress.env('FIREBASE_PROJECT_ID');
if (!projectId) {
  throw new Error('Missing Cypress env var: FIREBASE_PROJECT_ID');
}
const firestoreEmulatorUrl = Cypress.env('FIRESTORE_EMULATOR_URL') || 'http://localhost:8080';

/**
 * Imposta il profilo utente in Firestore
 * @param {string} uid - ID utente
 * @param {string} role - Ruolo dell'utente
 * @param {string} idToken - Token ID dell'utente
 * @param {object} profile - Dati del profilo
 */
export function setUserProfile(uid, role, idToken, profile) {
  const now = new Date().toISOString();
  return cy.request({
    method: 'PATCH',
    url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
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

/**
 * Ottiene un utente da Firestore
 * @param {string} uid - ID utente
 * @param {string} idToken - Token ID dell'utente (opzionale)
 */
export function getUserFromFirestore(uid, idToken) {
  return cy.request({
    method: 'GET',
    url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
    headers: idToken ? {
      Authorization: `Bearer ${idToken}`
    } : {},
    failOnStatusCode: false
  });
}

/**
 * Elimina tutti gli utenti dalla collection users
 */
export function deleteAllUsers() {
  return cy.request({
    method: 'DELETE',
    url: `${firestoreEmulatorUrl}/emulator/v1/projects/${projectId}/databases/(default)/documents/users`,
    failOnStatusCode: false
  });
}

/**
 * Elimina un documento specifico da Firestore
 * @param {string} collection - Nome della collection
 * @param {string} docId - ID del documento
 */
export function deleteDocument(collection, docId) {
  return cy.request({
    method: 'DELETE',
    url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`,
    failOnStatusCode: false
  });
}

/**
 * Ottiene un documento da Firestore
 * @param {string} collection - Nome della collection
 * @param {string} docId - ID del documento
 * @param {string} idToken - Token ID (opzionale)
 */
export function getDocument(collection, docId, idToken) {
  return cy.request({
    method: 'GET',
    url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`,
    headers: idToken ? {
      Authorization: `Bearer ${idToken}`
    } : {},
    failOnStatusCode: false
  });
}
