/**
 * LoginPage - Page Object per la pagina di login
 */
export class LoginPage {
  selectors = {
    email: '#email',
    password: '#password',
    loginButton: '#login-btn'
  };

  visit() {
    cy.visit('/login', { failOnStatusCode: false });
  }

  fillForm(email, password) {
    cy.typeInto(this.selectors.email, email);
    cy.typeInto(this.selectors.password, password);
  }

  submit() {
    cy.get(this.selectors.loginButton).click();
  }

  login(email, password) {
    this.visit();
    this.fillForm(email, password);
    this.submit();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  }
}
