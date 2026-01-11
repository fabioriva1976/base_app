import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: [
      // Auth tests
      'cypress/e2e/auth/login.cy.js',

      // Profile tests
      'cypress/e2e/profile/profile.cy.js',

      // Users tests
      'cypress/e2e/users/users-create.cy.js',
      'cypress/e2e/users/users-update-delete.cy.js',
      'cypress/e2e/users/users-ui.cy.js',
      'cypress/e2e/users/users-create-po.cy.js', // Esempio con Page Objects

      // Settings tests
      'cypress/e2e/settings/settings.cy.js',

      // Anagrafica Clienti tests
      'cypress/e2e/anagrafica-clienti/anagrafica-clienti-create.cy.js',
      'cypress/e2e/anagrafica-clienti/anagrafica-clienti-update-delete.cy.js',
      'cypress/e2e/anagrafica-clienti/anagrafica-clienti-ui.cy.js',
      'cypress/e2e/anagrafica-clienti/anagrafica-clienti-documenti.cy.js',
      'cypress/e2e/anagrafica-clienti/anagrafica-clienti-note.cy.js',
      'cypress/e2e/anagrafica-clienti/anagrafica-clienti-create-po.cy.js' // Esempio con Page Objects
    ],
  },
});
