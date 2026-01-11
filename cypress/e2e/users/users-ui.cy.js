import { UsersPage } from '../../pages/UsersPage.js';

describe('Users - UI e Sidebar (con Page Objects)', () => {
  const usersPage = new UsersPage();
  const adminPassword = 'AdminPass123!';
  const credentials = {
    email: `admin.users.ui.${Date.now()}@test.local`,
    password: adminPassword
  };

  before(() => {
    cy.clearAllUsers();
    cy.seedAdmin(credentials.email, credentials.password);
  });

  beforeEach(() => {
    cy.login(credentials.email, credentials.password);
    usersPage.visitPage();
  });

  describe('Tabella', () => {
    it('dovrebbe visualizzare le colonne corrette', () => {
      usersPage.shouldHaveAllColumns();
    });

    it('dovrebbe avere il pulsante Nuovo Utente', () => {
      usersPage.shouldShowNewUserButton();
    });

    it('dovrebbe filtrare i risultati con la ricerca', () => {
      usersPage.openNewUserSidebar();

      const userEmail = `search.${Date.now()}@test.local`;
      usersPage.fillUserForm({
        nome: 'Ricerca',
        cognome: 'Utente',
        email: userEmail,
        password: 'Password123!',
        ruolo: 'operatore'
      });
      usersPage.submitForm();
      usersPage.waitForSaveComplete();
      usersPage.closeSidebar();

      usersPage.waitForTableSync(userEmail, { exists: true });
      usersPage.findTableRow(userEmail);
    });
  });

  describe('Sidebar - Apertura e Chiusura', () => {
    it('dovrebbe aprire la sidebar al click su Nuovo Utente', () => {
      usersPage.expectSidebarOpen(false);
      usersPage.openNewUserSidebar();
      usersPage.expectSidebarOpen(true);
    });

    it('dovrebbe mostrare il titolo "Nuovo Utente"', () => {
      usersPage.openNewUserSidebar();
      usersPage.expectSidebarTitle('Nuovo Utente');
    });

    it('dovrebbe chiudere la sidebar con il bottone X', () => {
      usersPage.openNewUserSidebar();
      usersPage.closeSidebar();
      usersPage.expectSidebarOpen(false);
    });

    it('dovrebbe chiudere la sidebar al click sulla tabella', () => {
      usersPage.openNewUserSidebar();
      usersPage.clickTable();
      usersPage.expectSidebarOpen(false);
    });

    it('dovrebbe cambiare titolo quando si modifica un utente', () => {
      usersPage.openNewUserSidebar();

      const userEmail = `title.${Date.now()}@test.local`;
      const fullName = 'Titolo Utente';
      usersPage.fillUserForm({
        nome: 'Titolo',
        cognome: 'Utente',
        email: userEmail,
        password: 'Password123!',
        ruolo: 'operatore'
      });
      usersPage.submitForm();
      usersPage.waitForSaveComplete();
      usersPage.closeSidebar();

      usersPage.waitForTableSync(userEmail, { exists: true });
      usersPage.editUser(userEmail);
      usersPage.expectSidebarTitle(fullName);
    });
  });

  describe('Sidebar - Tab per Nuovo Utente', () => {
    it('dovrebbe nascondere il tab Azioni per nuovo utente', () => {
      usersPage.openNewUserSidebar();
      usersPage.expectAnagraficaTabVisible();
      usersPage.expectActionsTabVisible(false);
    });

    it('dovrebbe mostrare il tab Azioni per utente esistente', () => {
      usersPage.openNewUserSidebar();

      const userEmail = `tabs.${Date.now()}@test.local`;
      usersPage.fillUserForm({
        nome: 'Tab',
        cognome: 'Utente',
        email: userEmail,
        password: 'Password123!',
        ruolo: 'operatore'
      });
      usersPage.submitForm();
      usersPage.waitForSaveComplete();

      usersPage.expectAnagraficaTabVisible();
      usersPage.expectActionsTabVisible(true);
    });
  });

  describe('Sidebar - Navigazione Tab', () => {
    it('dovrebbe cambiare tab al click', () => {
      usersPage.openNewUserSidebar();

      const userEmail = `nav.${Date.now()}@test.local`;
      usersPage.fillUserForm({
        nome: 'Nav',
        cognome: 'Utente',
        email: userEmail,
        password: 'Password123!',
        ruolo: 'operatore'
      });
      usersPage.submitForm();
      usersPage.waitForSaveComplete();

      cy.get('#tab-anagrafica').should('have.class', 'active');
      cy.get('[data-tab="anagrafica"]').should('have.class', 'active');

      usersPage.openActionsTab();
      cy.get('#tab-azioni').should('have.class', 'active');
      cy.get('[data-tab="azioni"]').should('have.class', 'active');
      cy.get('#tab-anagrafica').should('not.have.class', 'active');
    });
  });
});
