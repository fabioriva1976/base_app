describe('Anagrafica Clienti - update e delete', () => {
  it('dovrebbe aggiornare un cliente e mostrare le azioni', () => {
    const adminEmail = `admin.update.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => cy.setUserRole(uid, 'admin', idToken, adminEmail));

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-UPD-${Date.now()}`;
    const emailCliente = `cliente.update.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Azienda Originale SRL');
    cy.get('#email').type(emailCliente);
    cy.get('#piva').type('11111111111');
    cy.get('#telefono').type('+39 333 1111111');

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('contain', 'Salvato');

    // Verifica azioni dopo la creazione
    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list', { timeout: 10000 }).contains('Creazione').should('be.visible');

    // Aggiorna dati cliente
    cy.get('#close-sidebar-btn').click();
    cy.wait(1000);
    cy.findDataTableRow(codiceCliente, { timeout: 20000 });
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    cy.get('#ragione_sociale').clear().type('Azienda Modificata SRL');
    cy.get('#piva').clear().type('22222222222');
    cy.get('#telefono').clear().type('+39 333 2222222');
    cy.get('#indirizzo').type('Via Nuova 456');
    cy.get('#citta').type('Roma');
    cy.get('#cap').type('00100');

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('button[type="submit"][form="entity-form"]').should('be.disabled');
    cy.get('button[type="submit"][form="entity-form"]', { timeout: 10000 }).should('not.be.disabled');

    // Riapri per caricare lo storico azioni aggiornato
    cy.get('#close-sidebar-btn').click();
    cy.findDataTableRow(codiceCliente, { timeout: 20000 });
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    // Verifica dati aggiornati
    cy.get('#ragione_sociale').should('have.value', 'Azienda Modificata SRL');
    cy.get('#piva').should('have.value', '22222222222');
    cy.get('#telefono').should('have.value', '+39 333 2222222');
    cy.get('#indirizzo').should('have.value', 'Via Nuova 456');
    cy.get('#citta').should('have.value', 'Roma');
    cy.get('#cap').should('have.value', '00100');

    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list').contains('Modifica', { timeout: 10000 }).should('be.visible');
  });

  it('dovrebbe eliminare un cliente creato', () => {
    const adminEmail = `admin.delete.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => cy.setUserRole(uid, 'admin', idToken, adminEmail));

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-DEL-${Date.now()}`;
    const emailCliente = `cliente.delete.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Azienda da Eliminare SRL');
    cy.get('#email').type(emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('contain', 'Salvato');
    cy.get('#close-sidebar-btn').click();
    cy.findDataTableRow(codiceCliente);
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-delete').click();
    });

    cy.get('.btn-confirm-yes').click();
    cy.wait(1000);

    cy.searchDataTable(codiceCliente);
    cy.get('#data-table', { timeout: 20000 }).should('not.contain', codiceCliente);
  });

  it('dovrebbe annullare la cancellazione di un cliente', () => {
    const adminEmail = `admin.cancel.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => cy.setUserRole(uid, 'admin', idToken, adminEmail));

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });
    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-CANCEL-${Date.now()}`;
    const emailCliente = `cliente.cancel.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Azienda Non Eliminare SRL');
    cy.get('#email').type(emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('contain', 'Salvato');
    cy.get('#close-sidebar-btn').click();
    cy.wait(1000);
    cy.findDataTableRow(codiceCliente, { timeout: 20000 });
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-delete').click();
    });

    cy.get('.btn-confirm-no').click();
    cy.wait(1000);

    cy.searchDataTable(codiceCliente);
    cy.get('#data-table', { timeout: 20000 }).should('contain', codiceCliente);
  });
});
