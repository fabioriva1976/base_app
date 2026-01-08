// Cypress support file per test e2e
// Qui puoi aggiungere comandi personalizzati e configurazioni globali

// Import comandi personalizzati (se necessari)
// import './commands'

// Esempio: ignorare eccezioni non catturate specifiche
Cypress.on('uncaught:exception', (err, runnable) => {
  // Restituire false previene che Cypress fallisca il test
  // Puoi aggiungere logica per gestire eccezioni specifiche
  return false;
});
