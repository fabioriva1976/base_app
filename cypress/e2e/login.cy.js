describe('Flusso di Autenticazione', () => {
  const apiKey = 'AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s';
  // Usa sempre localhost perché il container Cypress usa network_mode: host
  const authEmulatorUrl = 'http://localhost:9099';

  function createAuthUser(email, password) {
    return cy.request({
      method: 'POST',
      url: `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      body: {
        email,
        password,
        returnSecureToken: true
      },
      failOnStatusCode: false // Non fallire se l'utente esiste già
    });
  }

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

    createAuthUser(email, password);

    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#login-btn').click();

    // Dopo il login, l'utente viene rediretto alla dashboard
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  });
});
