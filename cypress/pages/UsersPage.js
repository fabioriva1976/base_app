import { BasePage } from './BasePage.js';

/**
 * UsersPage - Page Object per la gestione utenti
 */
export class UsersPage extends BasePage {
  // Selettori
  selectors = {
    dataTable: '#data-table',
    newEntityButton: '#new-entity-btn',
    sidebar: '#entity-form-sidebar',
    sidebarTitle: '#entity-form-title',
    closeSidebarButton: '#close-sidebar-btn',
    entityForm: '#entity-form',
    submitButton: 'button[type="submit"][form="entity-form"]',
    entityId: '#entity-id',

    // Campi form
    nome: '#nome',
    cognome: '#cognome',
    email: '#email',
    password: '#password',
    ruoloMultiselect: '#ruolo-multiselect-hidden',

    // Tab
    tabAnagrafica: '[data-tab="anagrafica"]',
    tabAnagraficaButton: '#tab-anagrafica',
    tabAzioni: '[data-tab="azioni"]',
    tabAzioniButton: '#tab-azioni',

    // Lista azioni
    actionList: '#action-list',

    // Pulsanti azioni tabella
    editButton: '.btn-edit',
    deleteButton: '.btn-delete',
    confirmYesButton: '.btn-confirm-yes',
    confirmNoButton: '.btn-confirm-no',

    // Colonne tabella
    columns: {
      nome: 'th:contains("Nome")',
      cognome: 'th:contains("Cognome")',
      email: 'th:contains("Email")',
      ruolo: 'th:contains("Ruolo")',
      status: 'th:contains("Status")',
      azioni: 'th:contains("Azioni")'
    }
  };

  /**
   * Naviga alla pagina utenti
   */
  visitPage() {
    this.visit('/users');
  }

  /**
   * Apre la sidebar per nuovo utente
   */
  openNewUserSidebar() {
    cy.get(this.selectors.newEntityButton).click();
    cy.get(this.selectors.sidebar).should('have.class', 'open');
  }

  /**
   * Chiude la sidebar
   */
  closeSidebar() {
    cy.get(this.selectors.closeSidebarButton).click();
    cy.get(this.selectors.sidebar).should('not.have.class', 'open');
  }

  /**
   * Compila il form utente
   * @param {object} userData - Dati dell'utente
   */
  fillUserForm(userData) {
    if (userData.nome) cy.typeInto(this.selectors.nome, userData.nome);
    if (userData.cognome) cy.typeInto(this.selectors.cognome, userData.cognome);
    if (userData.email) cy.typeInto(this.selectors.email, userData.email);
    if (userData.password) cy.typeInto(this.selectors.password, userData.password);
    if (userData.ruolo) {
      cy.get(this.selectors.ruoloMultiselect).select(userData.ruolo, { force: true });
    }
  }

  /**
   * Salva il form utente
   */
  submitForm() {
    cy.get(this.selectors.submitButton).scrollIntoView().click({ force: true });
  }

  /**
   * Attende che il salvataggio sia completato
   * @param {number} timeout - Timeout in millisecondi
   */
  waitForSaveComplete(timeout = 10000) {
    cy.get(this.selectors.entityId, { timeout }).invoke('val').should('match', /.+/);
  }

  /**
   * Verifica che il submit button sia disabilitato
   */
  shouldSubmitBeDisabled() {
    cy.get(this.selectors.submitButton).should('be.disabled');
  }

  /**
   * Verifica che il submit button non sia disabilitato
   */
  shouldSubmitBeEnabled() {
    cy.get(this.selectors.submitButton).should('not.be.disabled');
  }

  /**
   * Cerca un utente nella tabella
   * @param {string} text - Testo da cercare
   */
  searchInTable(text) {
    cy.searchDataTable(text);
  }

  /**
   * Trova una riga nella tabella
   * @param {string} text - Testo da cercare
   * @param {object} options - Opzioni aggiuntive
   */
  findTableRow(text, options = {}) {
    return cy.findDataTableRow(text, options);
  }

  /**
   * Attende la sincronizzazione della tabella
   * @param {string} text - Testo da cercare
   * @param {object} options - Opzioni aggiuntive
   */
  waitForTableSync(text, options = {}) {
    cy.waitForTableSync(text, options);
  }

  /**
   * Modifica un utente dalla tabella
   * @param {string} identifier - Identificatore dell'utente (email)
   */
  editUser(identifier) {
    this.findTableRow(identifier);
    cy.get(this.selectors.dataTable)
      .contains('td', identifier)
      .closest('tr')
      .within(() => {
        cy.get(this.selectors.editButton).click();
      });
  }

  /**
   * Elimina un utente dalla tabella
   * @param {string} identifier - Identificatore dell'utente (email)
   */
  deleteUser(identifier) {
    this.findTableRow(identifier);
    cy.get(this.selectors.dataTable)
      .contains('td', identifier)
      .closest('tr')
      .within(() => {
        cy.get(this.selectors.deleteButton).click();
      });
  }

  /**
   * Conferma l'eliminazione
   */
  confirmDelete() {
    cy.get(this.selectors.confirmYesButton).click();
  }

  /**
   * Annulla l'eliminazione
   */
  cancelDelete() {
    cy.get(this.selectors.confirmNoButton).click();
  }

  /**
   * Verifica che la tabella contenga tutte le colonne
   */
  shouldHaveAllColumns() {
    cy.get(this.selectors.dataTable).should('exist');
    cy.get(this.selectors.dataTable).contains('th', 'Nome').should('exist');
    cy.get(this.selectors.dataTable).contains('th', 'Cognome').should('exist');
    cy.get(this.selectors.dataTable).contains('th', 'Email').should('exist');
    cy.get(this.selectors.dataTable).contains('th', 'Ruolo').should('exist');
    cy.get(this.selectors.dataTable).contains('th', 'Status').should('exist');
    cy.get(this.selectors.dataTable).contains('th', 'Azioni').should('exist');
  }

  /**
   * Verifica che il pulsante Nuovo Utente sia visibile
   */
  shouldHaveNewUserButton() {
    cy.get(this.selectors.newEntityButton).should('be.visible');
    cy.get(this.selectors.newEntityButton).should('contain', 'Nuovo Utente');
  }

  /**
   * Cambia tab nella sidebar
   * @param {string} tabName - Nome del tab ('anagrafica' o 'azioni')
   */
  switchTab(tabName) {
    const tabSelector = tabName === 'anagrafica'
      ? this.selectors.tabAnagrafica
      : this.selectors.tabAzioni;
    cy.get(tabSelector).click();
  }

  /**
   * Verifica che un tab sia visibile
   * @param {string} tabName - Nome del tab
   */
  shouldTabBeVisible(tabName) {
    const tabSelector = tabName === 'anagrafica'
      ? this.selectors.tabAnagrafica
      : this.selectors.tabAzioni;
    cy.get(tabSelector).should('be.visible');
  }

  /**
   * Verifica che un tab non sia visibile
   * @param {string} tabName - Nome del tab
   */
  shouldTabNotBeVisible(tabName) {
    const tabSelector = tabName === 'anagrafica'
      ? this.selectors.tabAnagrafica
      : this.selectors.tabAzioni;
    cy.get(tabSelector).should('not.be.visible');
  }

  /**
   * Verifica che un tab sia attivo
   * @param {string} tabName - Nome del tab
   */
  shouldTabBeActive(tabName) {
    const buttonSelector = tabName === 'anagrafica'
      ? this.selectors.tabAnagraficaButton
      : this.selectors.tabAzioniButton;
    const tabSelector = tabName === 'anagrafica'
      ? this.selectors.tabAnagrafica
      : this.selectors.tabAzioni;
    cy.get(buttonSelector).should('have.class', 'active');
    cy.get(tabSelector).should('have.class', 'active');
  }

  /**
   * Verifica che la lista azioni contenga un tipo di azione
   * @param {string} actionType - Tipo di azione (es. 'Creazione', 'Modifica')
   */
  shouldHaveAction(actionType) {
    cy.get(this.selectors.actionList, { timeout: 10000 })
      .contains(actionType)
      .should('be.visible');
  }

  /**
   * Verifica il titolo della sidebar
   * @param {string} title - Titolo atteso
   */
  shouldHaveTitle(title) {
    cy.get(this.selectors.sidebarTitle).should('contain', title);
  }
}
