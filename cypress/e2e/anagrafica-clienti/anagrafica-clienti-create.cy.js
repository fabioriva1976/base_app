describe('Anagrafica Clienti - creazione', () => {
  it('dovrebbe creare un nuovo cliente con campi obbligatori', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.${Date.now()}@test.local`;

    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Test SRL');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('contain', 'Salvato');
    cy.get('#close-sidebar-btn').click();

    cy.findDataTableRow(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Test SRL').should('be.visible');
  });

  it('dovrebbe creare un nuovo cliente con tutti i campi compilati', () => {
    const adminEmail = `admin.full.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-FULL-${Date.now()}`;
    const emailCliente = `cliente.full.${Date.now()}@test.local`;

    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Azienda Completa SRL');
    cy.typeInto('#piva', '12345678901');
    cy.typeInto('#cf', 'RSSMRA80A01H501U');
    cy.typeInto('#email', emailCliente);
    cy.typeInto('#telefono', '+39 333 1234567');
    cy.typeInto('#indirizzo', 'Via Roma 123');
    cy.typeInto('#citta', 'Milano');
    cy.typeInto('#cap', '20100');
    cy.get('#toggle-stato').should('be.checked');

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('contain', 'Salvato');
    cy.get('#close-sidebar-btn').click();

    cy.findDataTableRow(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Azienda Completa SRL').should('be.visible');
    cy.get('#data-table', { timeout: 10000 }).contains('12345678901').should('be.visible');
  });

  it('dovrebbe creare un cliente disattivato', () => {
    const adminEmail = `admin.inactive.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-INACTIVE-${Date.now()}`;
    const emailCliente = `cliente.inactive.${Date.now()}@test.local`;

    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Disattivato SRL');
    cy.typeInto('#email', emailCliente);
    cy.get('#toggle-stato').uncheck({ force: true });

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('contain', 'Salvato');
    cy.get('#close-sidebar-btn').click();

    cy.findDataTableRow(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Cliente Disattivato SRL').should('be.visible');
  });
});
