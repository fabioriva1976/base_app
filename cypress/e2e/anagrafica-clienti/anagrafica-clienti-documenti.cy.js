import { AnagraficaClientiPage } from '../../pages/AnagraficaClientiPage.js';

describe('Anagrafica Clienti - Documenti', () => {
  const clientiPage = new AnagraficaClientiPage();

  before(() => {
    cy.clearAllClienti();
  });

  it('dovrebbe caricare e visualizzare un documento allegato', () => {
    const adminEmail = `admin.docs.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.docs.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Test Documenti SRL',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('attachments');

    const fileName = 'test-document.txt';
    const fileContent = 'Contenuto del documento di test';

    cy.get('#document-upload').selectFile({
      contents: Cypress.Buffer.from(fileContent),
      fileName,
      mimeType: 'text/plain'
    }, { force: true });

    cy.get('.file-preview-item.pending-file').should('be.visible');
    cy.get('.file-name').should('contain', fileName);
    cy.get('.btn-upload').click();

    cy.get('.file-preview-item.existing-file', { timeout: 10000 }).should('be.visible');
    cy.get('.file-name-link').should('contain', fileName);

    clientiPage.switchTab('azioni');
    cy.get('#action-list', { timeout: 20000 }).should('be.visible');
  });

  it('dovrebbe eliminare un documento allegato', () => {
    const adminEmail = `admin.deletedoc.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.deletedoc.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Test Delete Doc SRL',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('attachments');

    const fileName = 'document-to-delete.txt';
    cy.get('#document-upload').selectFile({
      contents: Cypress.Buffer.from('Da eliminare'),
      fileName,
      mimeType: 'text/plain'
    }, { force: true });

    cy.get('.btn-upload').click();
    cy.get('.file-preview-item.existing-file', { timeout: 10000 }).should('be.visible');

    cy.get('.remove-file-btn').first().click();
    cy.get('.delete-confirmation-overlay').should('be.visible');
    cy.get('.btn-confirm-yes').click();

    cy.get('.file-preview-item', { timeout: 10000 }).should('not.exist');
    cy.get('.empty-state').should('be.visible');

    clientiPage.switchTab('azioni');
    cy.get('#action-list', { timeout: 20000 }).should('be.visible');
  });

  it('dovrebbe aggiungere una descrizione al documento', () => {
    const adminEmail = `admin.docdesc.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.docdesc.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Test Descrizione SRL',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('attachments');

    const fileName = 'contract.pdf';
    const description = 'Contratto di fornitura 2026';

    cy.get('#document-upload').selectFile({
      contents: Cypress.Buffer.from('PDF content'),
      fileName,
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
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.viewdocs.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Test View SRL',
      piva: '55667788990',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('attachments');

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

    clientiPage.closeSidebar();
    clientiPage.editClient(codiceCliente);
    clientiPage.switchTab('attachments');
    cy.get('.file-preview-item.existing-file', { timeout: 10000 }).should('have.length', 2);
    cy.get('.file-name-link').first().should('contain', 'documento');
  });
});
