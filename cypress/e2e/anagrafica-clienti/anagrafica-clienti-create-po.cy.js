import { AnagraficaClientiPage } from '../../pages/AnagraficaClientiPage.js';

/**
 * Test di esempio usando Page Objects
 * Questo test mostra come utilizzare i Page Objects per creare test più leggibili e manutenibili
 */
describe('Anagrafica Clienti - creazione (con Page Objects)', () => {
  const clientiPage = new AnagraficaClientiPage();

  it('dovrebbe creare un nuovo cliente con campi obbligatori', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    // Usa il Page Object per navigare e interagire con la pagina
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `cliente.${Date.now()}@test.local`;

    // Usa il Page Object per compilare il form
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Test SRL',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.shouldShowSaveMessage();
    clientiPage.closeSidebar();

    // Usa il Page Object per verificare nella tabella
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

    // Usa fixture per i dati completi
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
});
