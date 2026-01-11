describe('Users - creazione', () => {
  const apiKey = 'AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s';
  const authEmulatorUrl = 'http://localhost:9099';

  function setCustomClaims(uid, claims) {
    // Usa l'API REST dell'emulatore per settare custom claims
    return cy.request({
      method: 'POST',
      url: `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
      body: {
        localId: uid,
        customAttributes: JSON.stringify(claims)
      },
      failOnStatusCode: false
    });
  }

  function setUserRole(uid, role, idToken, email) {
    return setCustomClaims(uid, { role: role })
      .then(() => cy.setUserRole(uid, role, idToken, email));
  }

  it('dovrebbe creare un nuovo utente operatore', () => {
    const adminEmail = `admin.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.createAuthUser(adminEmail, adminPassword)
      .then(({ uid, idToken }) => setUserRole(uid, 'admin', idToken, adminEmail));

    cy.login(adminEmail, adminPassword);

    // Attendi che i custom claims siano caricati
    cy.wait(500);

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
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    cy.get('#close-sidebar-btn').click();

    // Attendi che la tabella si aggiorni dopo la creazione
    cy.wait(1000);

    cy.findDataTableRow(userEmail);
  });
});
