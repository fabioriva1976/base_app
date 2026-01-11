import { AnagraficaClientiPage } from '../../pages/AnagraficaClientiPage.js';

describe('Anagrafica Clienti - creazione', () => {
  const clientiPage = new AnagraficaClientiPage();

  before(() => {
    cy.clearAllClienti();
  });

  it('dovrebbe creare un nuovo cliente con campi obbligatori', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.${Date.now()}@test.local`;

    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Test SRL',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.shouldShowSaveMessage();
    clientiPage.closeSidebar();

    clientiPage.findTableRow(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Test SRL').should('be.visible');
  });

  it('dovrebbe creare un nuovo cliente con tutti i campi compilati', () => {
    const adminEmail = `admin.full.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-FULL-${Date.now()}`;
    const emailCliente = `cliente.full.${Date.now()}@test.local`;

    cy.fixture('testData').then((testData) => {
      const clientData = {
        codice: codiceCliente,
        email: emailCliente,
        ...testData.clienti.complete,
        ragioneSociale: testData.clienti.complete.ragioneSociale
      };

      clientiPage.fillClientForm(clientData);
      clientiPage.submitForm();
      clientiPage.waitForSaveComplete();
      clientiPage.shouldShowSaveMessage();
      clientiPage.closeSidebar();

      clientiPage.findTableRow(codiceCliente);
      cy.get('#data-table', { timeout: 10000 }).contains('Azienda Completa SRL').should('be.visible');
      cy.get('#data-table', { timeout: 10000 }).contains('12345678901').should('be.visible');
    });
  });

  it('dovrebbe creare un cliente disattivato', () => {
    const adminEmail = `admin.inactive.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-INACTIVE-${Date.now()}`;
    const emailCliente = `cliente.inactive.${Date.now()}@test.local`;

    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Disattivato SRL',
      email: emailCliente,
      stato: false
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.shouldShowSaveMessage();
    clientiPage.closeSidebar();

    clientiPage.findTableRow(codiceCliente);
    cy.get('#data-table', { timeout: 10000 }).contains('Cliente Disattivato SRL').should('be.visible');
  });
});
