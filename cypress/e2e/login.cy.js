describe('Flusso di Autenticazione', () => {
  beforeEach(() => {
    // Visita la pagina di login prima di ogni test
    // failOnStatusCode: false perché il middleware potrebbe causare redirect strani
    cy.visit('/login', { failOnStatusCode: false });
  });

  it('dovrebbe mostrare un errore con credenziali sbagliate', () => {
    cy.get('#email').type('wrong@email.com');
    cy.get('#password').type('wrongpassword');
    cy.get('#login-btn').click();

    cy.contains(/Email o password non corretti|Utente non trovato/).should('be.visible');
  });

  it('dovrebbe permettere il login con credenziali valide', () => {
    const email = `fabio.riva@oto.agency`;
    const password = 'asdasd';

    cy.createAuthUser(email, password);

    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#login-btn').click();

    // Dopo il login, l'utente viene rediretto alla dashboard
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  });
});
