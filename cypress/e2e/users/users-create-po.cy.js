import { UsersPage } from '../../pages/UsersPage.js';

/**
 * Test di esempio usando Page Objects
 * Questo test mostra come utilizzare i Page Objects per creare test più leggibili e manutenibili
 */
describe('Users - creazione (con Page Objects)', () => {
  const usersPage = new UsersPage();

  it('dovrebbe creare un nuovo utente operatore', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    // Usa il Page Object per navigare e interagire con la pagina
    usersPage.visitPage();
    usersPage.openNewUserSidebar();

    const userEmail = `operatore.${Date.now()}@test.local`;

    // Usa il Page Object per compilare il form
    usersPage.fillUserForm({
      nome: 'Mario',
      cognome: 'Rossi',
      email: userEmail,
      password: 'Password123!',
      ruolo: 'operatore'
    });

    usersPage.submitForm();
    usersPage.waitForSaveComplete();
    usersPage.closeSidebar();

    // Usa il Page Object per verificare nella tabella
    usersPage.waitForTableSync(userEmail, { exists: true });
  });
});
