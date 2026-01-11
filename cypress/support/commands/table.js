/**
 * Comandi Cypress per interazione con DataTable
 */

/**
 * Cerca un testo nella tabella usando il campo di ricerca
 */
Cypress.Commands.add('searchDataTable', (text) => {
  cy.get('input[type="search"], .datatable-input, .dataTable-input', { timeout: 10000 })
    .first()
    .clear()
    .type(text, { delay: 0 });
});

/**
 * Trova una riga nella tabella che contiene il testo specificato
 */
Cypress.Commands.add('findDataTableRow', (text, options = {}) => {
  const timeout = options.timeout || 20000;
  cy.searchDataTable(text);
  return cy.get('#data-table', { timeout })
    .contains('td', text, { timeout })
    .should('exist');
});

/**
 * Attende che la tabella si sincronizzi con il backend
 * Verifica che il testo sia presente o assente nella tabella
 */
Cypress.Commands.add('waitForTableSync', (text, options = {}) => {
  const timeout = options.timeout || 20000;
  const exists = options.exists !== false;
  cy.searchDataTable(text);
  if (exists) {
    return cy.get('#data-table', { timeout }).should('contain', text);
  }
  return cy.get('#data-table', { timeout }).should('not.contain', text);
});
