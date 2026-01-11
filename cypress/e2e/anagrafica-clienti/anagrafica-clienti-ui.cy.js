import { AnagraficaClientiPage } from '../../pages/AnagraficaClientiPage.js';

describe('Anagrafica Clienti - UI e Sidebar', () => {
  const clientiPage = new AnagraficaClientiPage();
  const credentials = {
    email: `admin.ui.${Date.now()}@test.local`,
    password: 'AdminPass123!'
  };

  before(() => {
    cy.clearAllClienti();
    cy.seedAdmin(credentials.email, credentials.password);
  });

  beforeEach(() => {
    cy.login(credentials.email, credentials.password);
    clientiPage.visitPage();
  });

  describe('Tabella', () => {
    it('dovrebbe visualizzare le colonne corrette', () => {
      clientiPage.shouldHaveAllColumns();
    });

    it('dovrebbe avere il pulsante Nuovo Cliente', () => {
      clientiPage.shouldHaveNewClientButton();
    });

    it('dovrebbe filtrare i risultati con la ricerca', () => {
      clientiPage.openNewClientSidebar();

      const codiceCliente = `CLI-SEARCH-${Date.now()}`;
      clientiPage.fillClientForm({
        codice: codiceCliente,
        ragioneSociale: 'Test Ricerca SRL',
        email: `search.${Date.now()}@test.local`
      });
      clientiPage.submitForm();
      clientiPage.waitForSaveComplete();
      clientiPage.closeSidebar();

      clientiPage.findTableRow(codiceCliente);
      cy.get('#data-table')
        .contains('Test Ricerca SRL')
        .scrollIntoView()
        .should('be.visible');
    });
  });

  describe('Sidebar - Apertura e Chiusura', () => {
    it('dovrebbe aprire la sidebar al click su Nuovo Cliente', () => {
      clientiPage.openNewClientSidebar();
    });

    it('dovrebbe mostrare il titolo "Nuovo Cliente"', () => {
      clientiPage.openNewClientSidebar();
      clientiPage.shouldHaveTitle('Nuovo Cliente');
    });

    it('dovrebbe chiudere la sidebar con il bottone X', () => {
      clientiPage.openNewClientSidebar();
      clientiPage.closeSidebar();
    });

    it('dovrebbe chiudere la sidebar al click sulla tabella', () => {
      clientiPage.openNewClientSidebar();
      clientiPage.clickOnTable();
      clientiPage.expectSidebarOpen(false);
    });

    it('dovrebbe cambiare titolo quando si modifica un cliente', () => {
      clientiPage.openNewClientSidebar();

      const codiceCliente = `CLI-TITLE-${Date.now()}`;
      const ragioneSociale = 'Test Titolo SRL';
      clientiPage.fillClientForm({
        codice: codiceCliente,
        ragioneSociale,
        email: `title.${Date.now()}@test.local`
      });
      clientiPage.submitForm();
      clientiPage.waitForSaveComplete();
      clientiPage.closeSidebar();

      clientiPage.findTableRow(codiceCliente);
      clientiPage.editClient(codiceCliente);
      clientiPage.shouldHaveTitle(ragioneSociale);
    });
  });

  describe('Sidebar - Tab per Nuovo Cliente', () => {
    it('dovrebbe nascondere i tab Documenti, Note e Azioni per nuovo cliente', () => {
      clientiPage.openNewClientSidebar();
      clientiPage.shouldTabBeVisible('anagrafica');
      clientiPage.shouldTabNotBeVisible('attachments');
      clientiPage.shouldTabNotBeVisible('note');
      clientiPage.shouldTabNotBeVisible('azioni');
    });

    it('dovrebbe mostrare tutti i tab per cliente esistente', () => {
      clientiPage.openNewClientSidebar();

      const codiceCliente = `CLI-TABS-${Date.now()}`;
      clientiPage.fillClientForm({
        codice: codiceCliente,
        ragioneSociale: 'Test Tab SRL',
        email: `tabs.${Date.now()}@test.local`
      });
      clientiPage.submitForm();
      clientiPage.waitForSaveComplete();

      clientiPage.shouldTabBeVisible('anagrafica');
      clientiPage.shouldTabBeVisible('attachments');
      clientiPage.shouldTabBeVisible('note');
      clientiPage.shouldTabBeVisible('azioni');
    });
  });

  describe('Sidebar - Navigazione Tab', () => {
    it('dovrebbe cambiare tab al click', () => {
      clientiPage.openNewClientSidebar();

      const codiceCliente = `CLI-NAV-${Date.now()}`;
      clientiPage.fillClientForm({
        codice: codiceCliente,
        ragioneSociale: 'Test Nav SRL',
        email: `nav.${Date.now()}@test.local`
      });
      clientiPage.submitForm();
      clientiPage.waitForSaveComplete();

      clientiPage.shouldTabBeActive('anagrafica');
      clientiPage.switchTab('azioni');
      clientiPage.shouldTabBeActive('azioni');
      clientiPage.shouldTabNotBeActive('anagrafica');
    });
  });
});
