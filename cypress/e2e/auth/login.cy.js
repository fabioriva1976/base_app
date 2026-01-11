import { LoginPage } from '../../pages/LoginPage.js';

describe('Flusso di Autenticazione', () => {
  const loginPage = new LoginPage();

  beforeEach(() => {
    // Visita la pagina di login prima di ogni test
    // failOnStatusCode: false perché il middleware potrebbe causare redirect strani
    loginPage.visit();
  });

  it('dovrebbe mostrare un errore con credenziali sbagliate', () => {
    loginPage.fillForm('wrong@email.com', 'wrongpassword');
    loginPage.submit();

    cy.contains(/Email o password non corretti|Utente non trovato/).should('be.visible');
  });

  it('dovrebbe permettere il login con credenziali valide', () => {
    const email = `fabio.riva@oto.agency`;
    const password = 'asdasd';

    cy.createAuthUser(email, password);

    loginPage.fillForm(email, password);
    loginPage.submit();

    // Dopo il login, l'utente viene rediretto alla dashboard
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  });
});
