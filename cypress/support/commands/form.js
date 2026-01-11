/**
 * Comandi Cypress per interazione con form
 */

/**
 * Pulisce e inserisce un valore in un campo input
 */
Cypress.Commands.add('typeInto', (selector, value) => {
  cy.get(selector).scrollIntoView().should('be.visible').clear();
  cy.get(selector).scrollIntoView().should('be.visible').type(value, { delay: 0 });
});
