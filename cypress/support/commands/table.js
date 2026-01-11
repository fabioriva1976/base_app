/**
 * Comandi Cypress per interazione con DataTable
 */

/**
 * Cerca un testo nella tabella usando il campo di ricerca
 */
Cypress.Commands.add('searchDataTable', (text) => {
  const selector = 'input[type="search"], .datatable-input, .dataTable-input';
  const maxAttempts = 20;
  const retryDelayMs = 200;
  const stableDelayMs = 100;

  const attemptType = (remaining) => {
    return cy.wait(stableDelayMs).then(() => {
      return cy.window({ timeout: 10000 }).then((win) => {
        const input = Array.from(win.document.querySelectorAll(selector))
          .find((el) => !el.disabled);
        if (!input) {
          if (remaining <= 0) {
            throw new Error('Search input is still disabled');
          }
          return cy.wait(retryDelayMs).then(() => attemptType(remaining - 1));
        }

        input.value = '';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
        return undefined;
      });
    });
  };

  return attemptType(maxAttempts);
});

function waitForTableText(text, options = {}) {
  const timeout = options.timeout || 20000;
  const retryDelayMs = options.retryDelayMs || 500;
  const maxAttempts = Math.max(1, Math.ceil(timeout / retryDelayMs));

  const attempt = (remaining) => {
    return cy.window({ timeout: 10000 }).then((win) => {
      const table = win.document.querySelector('#data-table');
      if (!table) {
        if (remaining <= 0) {
          throw new Error('Table not found');
        }
        return cy.wait(retryDelayMs).then(() => attempt(remaining - 1));
      }

      const cells = Array.from(table.querySelectorAll('td'));
      const found = cells.find((cell) => cell.textContent?.includes(text));
      if (found) {
        return cy.wrap(found);
      }

      if (remaining <= 0) {
        throw new Error(`Row not found: ${text}`);
      }
      return cy.wait(retryDelayMs).then(() => attempt(remaining - 1));
    });
  };

  return attempt(maxAttempts);
}

/**
 * Trova una riga nella tabella che contiene il testo specificato
 */
Cypress.Commands.add('findDataTableRow', (text, options = {}) => {
  cy.searchDataTable(text);
  return waitForTableText(text, options);
});

/**
 * Attende che la tabella si sincronizzi con il backend
 * Verifica che il testo sia presente o assente nella tabella
 */
Cypress.Commands.add('waitForTableSync', (text, options = {}) => {
  const exists = options.exists !== false;
  cy.searchDataTable(text);
  if (exists) {
    return waitForTableText(text, options);
  }
  const retryDelayMs = options.retryDelayMs || 500;
  const timeout = options.timeout || 20000;
  const maxAttempts = Math.max(1, Math.ceil(timeout / retryDelayMs));

  const attemptMissing = (remaining) => {
    return cy.window({ timeout: 10000 }).then((win) => {
      const table = win.document.querySelector('#data-table');
      if (!table) {
        if (remaining <= 0) {
          return undefined;
        }
        return cy.wait(retryDelayMs).then(() => attemptMissing(remaining - 1));
      }
      const cells = Array.from(table.querySelectorAll('td'));
      const found = cells.find((cell) => cell.textContent?.includes(text));
      if (!found) {
        return undefined;
      }
      if (remaining <= 0) {
        throw new Error(`Row still present: ${text}`);
      }
      return cy.wait(retryDelayMs).then(() => attemptMissing(remaining - 1));
    });
  };

  return attemptMissing(maxAttempts);
});
