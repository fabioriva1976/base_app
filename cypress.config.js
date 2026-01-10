import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: [
      'cypress/e2e/login.cy.js',
      'cypress/e2e/profile.cy.js',
      'cypress/e2e/users-create.cy.js',
      'cypress/e2e/users-update-delete.cy.js',
      'cypress/e2e/users-ui.cy.js',
      'cypress/e2e/settings.cy.js',
      'cypress/e2e/anagrafica-clienti-create.cy.js',
      'cypress/e2e/anagrafica-clienti-update-delete.cy.js',
      'cypress/e2e/anagrafica-clienti-ui.cy.js'
    ],
  },
});
