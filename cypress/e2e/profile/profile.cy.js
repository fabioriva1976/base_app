import { ProfilePage } from '../../pages/ProfilePage.js';

describe('Profile', () => {
  const profilePage = new ProfilePage();

  before(() => {
    cy.clearAllUsers();
    cy.clearAllAuthUsers();
  });

  it('dovrebbe creare il primo utente come SUPERUSER completando il profilo', () => {
    const email = `superuser.${Date.now()}@test.local`;
    const password = 'SuperPass123!';

    cy.clearAllUsers();
    cy.createAuthUser(email, password);
    cy.login(email, password);
    profilePage.visit();

    profilePage.expectEmail(email, 10000);
    profilePage.expectRoleExists(5000);

    profilePage.fillProfile({
      nome: 'Super',
      cognome: 'Admin',
      telefono: '+39 333 9999999'
    });

    profilePage.submitAndWait();
    profilePage.expectSaveMessageVisible(20000);
    profilePage.expectRole('Super User', 10000);

    profilePage.expectProfileValues({
      nome: 'Super',
      cognome: 'Admin',
      telefono: '+39 333 9999999'
    });

    cy.visit('/users', { failOnStatusCode: false });
    cy.searchDataTable(email);
    cy.get('#data-table', { timeout: 10000 }).should('contain', email);
    cy.get('#data-table').should('contain', 'Super');
    cy.get('#data-table').should('contain', 'Admin');
  });

  it('dovrebbe caricare e aggiornare i dati profilo', () => {
    const email = `admin.profile.${Date.now()}@test.local`;
    const password = 'AdminPass123!';

    cy.seedAdmin(email, password);
    cy.login(email, password);
    profilePage.visit();

    profilePage.expectEmail(email, 20000);
    profilePage.expectRole('Amministratore', 20000);

    profilePage.fillProfile({
      nome: 'Mario',
      cognome: 'Rossi',
      telefono: '+39 333 0000000'
    });

    profilePage.submitAndWait();
    profilePage.expectSaveMessageVisible(20000);

    profilePage.expectProfileValues({
      nome: 'Mario',
      cognome: 'Rossi',
      telefono: '+39 333 0000000'
    });
  });

  it('dovrebbe aggiornare l\'avatar quando cambia il nome profilo', () => {
    const email = `avatar.${Date.now()}@test.local`;
    const password = 'AdminPass123!';

    cy.seedAdmin(email, password);
    cy.login(email, password);
    profilePage.visit();

    profilePage.expectEmail(email, 10000);

    profilePage.fillProfile({ nome: 'Luigi' });
    profilePage.submitAndWait();
    profilePage.expectSaveMessageVisible(20000);
    profilePage.expectAvatarName('Luigi', 10000);
  });
});
