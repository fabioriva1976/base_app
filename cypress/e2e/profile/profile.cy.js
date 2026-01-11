describe('Profile', () => {
  it('dovrebbe creare il primo utente come SUPERUSER completando il profilo', () => {
    const email = `superuser.${Date.now()}@test.local`;
    const password = 'SuperPass123!';

    cy.clearAllUsers();
    cy.createAuthUser(email, password);
    cy.login(email, password);
    cy.visit('/profile', { failOnStatusCode: false });

    cy.get('#profile-email', { timeout: 10000 }).should('have.value', email);
    cy.get('#profile-ruolo', { timeout: 5000 }).should('exist');

    cy.get('#profile-nome').clear().type('Super');
    cy.get('#profile-cognome').clear().type('Admin');
    cy.get('#profile-telefono').clear().type('+39 333 9999999');

    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.get('#profile-save-message', { timeout: 10000 }).should('be.visible');
    cy.get('#profile-ruolo', { timeout: 10000 }).should('not.have.value', '').and('have.value', 'Super User');

    cy.get('#profile-nome').should('have.value', 'Super');
    cy.get('#profile-cognome').should('have.value', 'Admin');
    cy.get('#profile-telefono').should('have.value', '+39 333 9999999');

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
    cy.visit('/profile', { failOnStatusCode: false });

    cy.get('#profile-email', { timeout: 20000 }).should('have.value', email);
    cy.get('#profile-ruolo', { timeout: 20000 }).should('have.value', 'Amministratore');

    cy.get('#profile-nome').clear().type('Mario');
    cy.get('#profile-cognome').clear().type('Rossi');
    cy.get('#profile-telefono').clear().type('+39 333 0000000');

    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.get('#profile-save-message', { timeout: 10000 }).should('be.visible');

    cy.get('#profile-nome').should('have.value', 'Mario');
    cy.get('#profile-cognome').should('have.value', 'Rossi');
    cy.get('#profile-telefono').should('have.value', '+39 333 0000000');
  });

  it('dovrebbe aggiornare l\'avatar quando cambia il nome profilo', () => {
    const email = `avatar.${Date.now()}@test.local`;
    const password = 'AdminPass123!';

    cy.seedAdmin(email, password);
    cy.login(email, password);
    cy.visit('/profile', { failOnStatusCode: false });

    cy.get('#profile-email', { timeout: 10000 }).should('have.value', email);

    cy.get('#profile-nome').clear().type('Luigi');
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.get('#profile-save-message', { timeout: 10000 }).should('be.visible');

    const expected = encodeURIComponent('Luigi');
    cy.get('#avatar-icon', { timeout: 10000 })
      .should('have.attr', 'src')
      .and('include', `name=${expected}`);
  });
});
