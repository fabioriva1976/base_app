/**
 * Comandi Cypress per interazione con form
 */

/**
 * Pulisce e inserisce un valore in un campo input
 */
Cypress.Commands.add('typeInto', (selector, value) => {
  cy.get(selector).clear().type(value, { delay: 0 });
});
