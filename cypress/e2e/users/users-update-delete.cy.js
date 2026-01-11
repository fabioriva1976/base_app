import { UsersPage } from '../../pages/UsersPage.js';

describe('Users - update e delete (con Page Objects)', () => {
  const usersPage = new UsersPage();

  before(() => {
    cy.clearAllUsers();
  });

  it('dovrebbe aggiornare un utente e mostrare le azioni', () => {
    const adminEmail = `admin.update.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    usersPage.visitPage();
    usersPage.openNewUserSidebar();

    const userEmail = `operatore.update.${Date.now()}@test.local`;

    usersPage.fillUserForm({
      nome: 'Mario',
      cognome: 'Rossi',
      email: userEmail,
      password: 'Password123!',
      ruolo: 'operatore'
    });

    usersPage.submitForm();
    usersPage.waitForSaveComplete();
    usersPage.openActionsTab();
    usersPage.expectAction('Creazione');

    usersPage.closeSidebar();
    usersPage.editUser(userEmail);

    usersPage.fillUserForm({
      nome: 'Luca',
      cognome: 'Bianchi'
    });

    usersPage.submitForm();
    usersPage.shouldSubmitBeDisabled();
    usersPage.shouldSubmitBeEnabled();

    usersPage.closeSidebar();
    usersPage.editUser(userEmail);
    usersPage.openActionsTab();
    usersPage.expectAction('Modifica');
  });

  it('dovrebbe eliminare un utente creato', () => {
    const adminEmail = `admin.delete.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    usersPage.visitPage();
    usersPage.openNewUserSidebar();

    const userEmail = `operatore.delete.${Date.now()}@test.local`;

    usersPage.fillUserForm({
      nome: 'Elisa',
      cognome: 'Verdi',
      email: userEmail,
      password: 'Password123!',
      ruolo: 'operatore'
    });

    usersPage.submitForm();
    usersPage.waitForSaveComplete();
    usersPage.closeSidebar();

    usersPage.deleteUser(userEmail);
    usersPage.confirmDelete();

    usersPage.waitForTableSync(userEmail, { exists: false });
  });
});
