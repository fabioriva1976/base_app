// Cypress support file per test e2e
// Importa i comandi personalizzati organizzati per categoria

import './commands/auth.js';
import './commands/table.js';
import './commands/form.js';
import './commands/firestore.js';

// Ignora eccezioni non catturate
Cypress.on('uncaught:exception', (err, runnable) => {
  // Restituire false previene che Cypress fallisca il test
  // Puoi aggiungere logica per gestire eccezioni specifiche
  return false;
});
