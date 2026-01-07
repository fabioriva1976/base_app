describe('Flusso di Autenticazione', () => {

  beforeEach(() => {
    // Visita la pagina di login prima di ogni test
    cy.visit('/login');
  });

  it('dovrebbe mostrare un errore con credenziali sbagliate', () => {
    cy.get('input[name="email"]').type('wrong@email.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.contains('Credenziali non valide').should('be.visible');
  });
});