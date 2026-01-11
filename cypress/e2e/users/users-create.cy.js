describe('Users - creazione', () => {
  it('dovrebbe creare un nuovo utente operatore', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);

    cy.login(adminEmail, adminPassword);

    cy.visit('/users', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    // Attendi che la sidebar sia completamente aperta
    cy.get('#entity-form-sidebar').should('have.class', 'open');

    const userEmail = `operatore.${Date.now()}@test.local`;

    // Usa invoke('val') per evitare problemi con re-render
    cy.get('#nome').invoke('val', 'Mario');
    cy.get('#cognome').invoke('val', 'Rossi');
    cy.get('#email').invoke('val', userEmail);
    cy.get('#password').invoke('val', 'Password123!');

    cy.get('#ruolo-multiselect-hidden').select('operatore', { force: true });
    cy.get('#ruolo-multiselect-hidden').should('have.value', 'operatore');

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });

    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#close-sidebar-btn').click();

    cy.waitForTableSync(userEmail, { exists: true });
  });
});
