/**
 * ProfilePage - Page Object per la pagina profilo
 */
export class ProfilePage {
  selectors = {
    nome: '#profile-nome',
    cognome: '#profile-cognome',
    email: '#profile-email',
    telefono: '#profile-telefono',
    ruolo: '#profile-ruolo',
    password: '#profile-password',
    saveButton: 'button[type="submit"]',
    saveMessage: '#profile-save-message',
    avatar: '#avatar-icon'
  };

  visit() {
    cy.visit('/profile', { failOnStatusCode: false });
  }

  expectEmail(email, timeout = 10000) {
    cy.get(this.selectors.email, { timeout }).should('have.value', email);
  }

  expectRole(value, timeout = 10000) {
    cy.get(this.selectors.ruolo, { timeout }).should('have.value', value);
  }

  expectRoleNotEmpty(timeout = 10000) {
    cy.get(this.selectors.ruolo, { timeout }).should('not.have.value', '');
  }

  expectRoleExists(timeout = 10000) {
    cy.get(this.selectors.ruolo, { timeout }).should('exist');
  }

  fillProfile(data) {
    if (data.nome) cy.typeInto(this.selectors.nome, data.nome);
    if (data.cognome) cy.typeInto(this.selectors.cognome, data.cognome);
    if (data.telefono) cy.typeInto(this.selectors.telefono, data.telefono);
    if (data.password) cy.typeInto(this.selectors.password, data.password);
  }

  submitAndWait() {
    cy.get(this.selectors.saveButton).scrollIntoView().click({ force: true });
  }

  expectSaveMessageVisible(timeout = 20000) {
    cy.get(this.selectors.saveMessage, { timeout }).should('be.visible');
  }

  expectProfileValues(data) {
    if (data.nome) cy.get(this.selectors.nome).should('have.value', data.nome);
    if (data.cognome) cy.get(this.selectors.cognome).should('have.value', data.cognome);
    if (data.telefono) cy.get(this.selectors.telefono).should('have.value', data.telefono);
  }

  expectAvatarName(name, timeout = 10000) {
    const expected = encodeURIComponent(name);
    cy.get(this.selectors.avatar, { timeout })
      .should('have.attr', 'src')
      .and('include', `name=${expected}`);
  }
}
