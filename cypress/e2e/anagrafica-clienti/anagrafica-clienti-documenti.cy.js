describe('Anagrafica Clienti - Documenti', () => {
  it('dovrebbe caricare e visualizzare un documento allegato', () => {
    const adminEmail = `admin.docs.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.docs.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Test Documenti SRL');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="attachments"]').click();
    cy.get('#tab-attachments').should('be.visible');

    const fileName = 'test-document.txt';
    const fileContent = 'Contenuto del documento di test';

    cy.get('#document-upload').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName: fileName,
      mimeType: 'text/plain'
    }, { force: true });

    cy.get('.file-preview-item.pending-file').should('be.visible');
    cy.get('.file-name').should('contain', fileName);
    cy.get('.btn-upload').click();

    cy.get('.file-preview-item.existing-file', { timeout: 10000 }).should('be.visible');
    cy.get('.file-name-link').should('contain', fileName);

    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list', { timeout: 20000 }).should('be.visible');
  });

  it('dovrebbe eliminare un documento allegato', () => {
    const adminEmail = `admin.deletedoc.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.deletedoc.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Test Delete Doc SRL');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="attachments"]').click();

    const fileName = 'document-to-delete.txt';
    cy.get('#document-upload').selectFile({
      contents: Cypress.Buffer.from('Da eliminare'),
      fileName: fileName,
      mimeType: 'text/plain'
    }, { force: true });

    cy.get('.btn-upload').click();
    cy.get('.file-preview-item.existing-file', { timeout: 10000 }).should('be.visible');

    cy.get('.remove-file-btn').first().click();
    cy.get('.delete-confirmation-overlay').should('be.visible');
    cy.get('.btn-confirm-yes').click();

    cy.get('.file-preview-item', { timeout: 10000 }).should('not.exist');
    cy.get('.empty-state').should('be.visible');

    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list', { timeout: 20000 }).should('be.visible');
  });

  it('dovrebbe aggiungere una descrizione al documento', () => {
    const adminEmail = `admin.docdesc.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.docdesc.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Test Descrizione SRL');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="attachments"]').click();

    const fileName = 'contract.pdf';
    const description = 'Contratto di fornitura 2026';

    cy.get('#document-upload').selectFile({
      contents: Cypress.Buffer.from('PDF content'),
      fileName: fileName,
      mimeType: 'application/pdf'
    }, { force: true });

    cy.get('.file-description-input').clear().type(description);
    cy.get('.btn-upload').click();

    cy.get('.file-preview-item.existing-file', { timeout: 10000 }).should('be.visible');
    cy.get('.file-description-display').should('contain', description);
  });

  it('dovrebbe visualizzare documenti di un cliente esistente', () => {
    const adminEmail = `admin.viewdocs.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.viewdocs.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Test View SRL');
    cy.typeInto('#piva', '55667788990');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="attachments"]').click();

    cy.get('#document-upload').selectFile({
      contents: Cypress.Buffer.from('Doc 1'),
      fileName: 'documento1.txt',
      mimeType: 'text/plain'
    }, { force: true });
    cy.get('.btn-upload').first().click();
    cy.wait(1000);

    cy.get('#document-upload').selectFile({
      contents: Cypress.Buffer.from('Doc 2'),
      fileName: 'documento2.txt',
      mimeType: 'text/plain'
    }, { force: true });
    cy.get('.btn-upload').first().click();

    cy.get('.file-preview-item.existing-file').should('have.length', 2);

    cy.get('#close-sidebar-btn').click();
    cy.searchDataTable(codiceCliente);
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    cy.get('[data-tab="attachments"]').click();
    cy.get('.file-preview-item.existing-file', { timeout: 10000 }).should('have.length', 2);
    cy.get('.file-name-link').first().should('contain', 'documento');
  });
});
