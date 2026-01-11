describe('Users - update e delete', () => {
  function setFieldValue(selector, value) {
    cy.get(selector).invoke('val', value).trigger('input', { force: true });
  }

  it('dovrebbe aggiornare un utente e mostrare le azioni', () => {
    const adminEmail = `admin.update.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);

    cy.login(adminEmail, adminPassword);

    cy.visit('/users', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const userEmail = `operatore.update.${Date.now()}@test.local`;

    setFieldValue('#nome', 'Mario');
    setFieldValue('#cognome', 'Rossi');
    setFieldValue('#email', userEmail);
    setFieldValue('#password', 'Password123!');
    cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    // Verifica azioni dopo la creazione
    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list', { timeout: 10000 }).contains('Creazione').should('be.visible');

    // Aggiorna dati utente
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#close-sidebar-btn').click();
    cy.findDataTableRow(userEmail);
    cy.get('#data-table').contains('td', userEmail).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    setFieldValue('#nome', 'Luca');
    setFieldValue('#cognome', 'Bianchi');
    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('button[type="submit"][form="entity-form"]').should('be.disabled');
    cy.get('button[type="submit"][form="entity-form"]', { timeout: 10000 }).should('not.be.disabled');

    // Riapri per caricare lo storico azioni aggiornato
    cy.get('#close-sidebar-btn').click();
    cy.findDataTableRow(userEmail);
    cy.get('#data-table').contains('td', userEmail).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list').contains('Modifica', { timeout: 10000 }).should('be.visible');
  });

  it('dovrebbe eliminare un utente creato', () => {
    const adminEmail = `admin.delete.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);

    cy.login(adminEmail, adminPassword);

    cy.visit('/users', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const userEmail = `operatore.delete.${Date.now()}@test.local`;

    setFieldValue('#nome', 'Elisa');
    setFieldValue('#cognome', 'Verdi');
    setFieldValue('#email', userEmail);
    setFieldValue('#password', 'Password123!');
    cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#close-sidebar-btn').click();
    cy.findDataTableRow(userEmail);
    cy.get('#data-table').contains('td', userEmail).closest('tr').within(() => {
      cy.get('.btn-delete').click();
    });

    cy.get('.btn-confirm-yes').click();

    cy.searchDataTable(userEmail);
    cy.get('#data-table', { timeout: 10000 }).should('not.contain', userEmail);
  });
});
