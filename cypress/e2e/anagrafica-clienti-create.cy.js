describe('Anagrafica Clienti - creazione', () => {
  it('dovrebbe creare un nuovo cliente con campi obbligatori', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => cy.setUserRole(uid, 'admin', idToken, adminEmail));

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Test SRL');
    cy.get('#email').type(emailCliente);

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

    cy.createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => cy.setUserRole(uid, 'admin', idToken, adminEmail));

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-FULL-${Date.now()}`;
    const emailCliente = `cliente.full.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Azienda Completa SRL');
    cy.get('#piva').type('12345678901');
    cy.get('#cf').type('RSSMRA80A01H501U');
    cy.get('#email').type(emailCliente);
    cy.get('#telefono').type('+39 333 1234567');
    cy.get('#indirizzo').type('Via Roma 123');
    cy.get('#citta').type('Milano');
    cy.get('#cap').type('20100');
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

    cy.createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => cy.setUserRole(uid, 'admin', idToken, adminEmail));

    cy.login(adminEmail, adminPassword);

    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-INACTIVE-${Date.now()}`;
    const emailCliente = `cliente.inactive.${Date.now()}@test.local`;

    cy.get('#codice').type(codiceCliente);
    cy.get('#ragione_sociale').type('Cliente Disattivato SRL');
    cy.get('#email').type(emailCliente);
    cy.get('#toggle-stato').uncheck({ force: true });

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#save-message', { timeout: 10000 }).should('contain', 'Salvato');
    cy.get('#close-sidebar-btn').click();

    cy.findDataTableRow(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Cliente Disattivato SRL').should('be.visible');
  });
});
