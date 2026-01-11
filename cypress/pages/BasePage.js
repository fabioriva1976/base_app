/**
 * BasePage - Classe base per tutti i Page Objects
 * Contiene metodi comuni utilizzabili da tutte le pagine
 */
export class BasePage {
  /**
   * Naviga alla pagina specificata
   * @param {string} path - Il percorso della pagina
   */
  visit(path) {
    cy.visit(path, { failOnStatusCode: false });
  }

  /**
   * Clicca su un elemento
   * @param {string} selector - Il selettore CSS
   * @param {object} options - Opzioni per il click
   */
  click(selector, options = {}) {
    cy.get(selector).click(options);
  }

  /**
   * Digita testo in un campo
   * @param {string} selector - Il selettore CSS
   * @param {string} value - Il valore da inserire
   */
  typeInto(selector, value) {
    cy.typeInto(selector, value);
  }

  /**
   * Verifica che un elemento contenga un testo
   * @param {string} selector - Il selettore CSS
   * @param {string} text - Il testo atteso
   */
  shouldContain(selector, text) {
    cy.get(selector).should('contain', text);
  }

  /**
   * Verifica che un elemento sia visibile
   * @param {string} selector - Il selettore CSS
   */
  shouldBeVisible(selector) {
    cy.get(selector).should('be.visible');
  }

  /**
   * Verifica che un elemento esista
   * @param {string} selector - Il selettore CSS
   */
  shouldExist(selector) {
    cy.get(selector).should('exist');
  }

  /**
   * Attende che un elemento diventi visibile
   * @param {string} selector - Il selettore CSS
   * @param {number} timeout - Timeout in millisecondi
   */
  waitForElement(selector, timeout = 10000) {
    cy.get(selector, { timeout }).should('exist');
  }

  /**
   * Scrolla fino a un elemento
   * @param {string} selector - Il selettore CSS
   */
  scrollTo(selector) {
    cy.get(selector).scrollIntoView();
  }
}
