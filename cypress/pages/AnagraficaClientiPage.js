import { BasePage } from './BasePage.js';

/**
 * AnagraficaClientiPage - Page Object per la gestione anagrafica clienti
 */
export class AnagraficaClientiPage extends BasePage {
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
    saveMessage: '#save-message',

    // Campi form
    codice: '#codice',
    ragioneSociale: '#ragione_sociale',
    piva: '#piva',
    cf: '#cf',
    email: '#email',
    telefono: '#telefono',
    indirizzo: '#indirizzo',
    citta: '#citta',
    cap: '#cap',
    toggleStato: '#toggle-stato',

    // Tab
    tabAnagrafica: '[data-tab="anagrafica"]',
    tabAnagraficaButton: '#tab-anagrafica',
    tabAttachments: '[data-tab="attachments"]',
    tabAttachmentsButton: '#tab-attachments',
    tabNote: '[data-tab="note"]',
    tabNoteButton: '#tab-note',
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
      codice: 'th:contains("Codice")',
      ragioneSociale: 'th:contains("Ragione Sociale")',
      piva: 'th:contains("P.IVA")',
      email: 'th:contains("Email")',
      azioni: 'th:contains("Azioni")'
    }
  };

  /**
   * Naviga alla pagina anagrafica clienti
   */
  visitPage() {
    this.visit('/anagrafica-clienti');
  }

  /**
   * Apre la sidebar per nuovo cliente
   */
  openNewClientSidebar() {
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
   * Compila il form cliente
   * @param {object} clientData - Dati del cliente
   */
  fillClientForm(clientData) {
    if (clientData.codice) cy.typeInto(this.selectors.codice, clientData.codice);
    if (clientData.ragioneSociale) cy.typeInto(this.selectors.ragioneSociale, clientData.ragioneSociale);
    if (clientData.piva) cy.typeInto(this.selectors.piva, clientData.piva);
    if (clientData.cf) cy.typeInto(this.selectors.cf, clientData.cf);
    if (clientData.email) cy.typeInto(this.selectors.email, clientData.email);
    if (clientData.telefono) cy.typeInto(this.selectors.telefono, clientData.telefono);
    if (clientData.indirizzo) cy.typeInto(this.selectors.indirizzo, clientData.indirizzo);
    if (clientData.citta) cy.typeInto(this.selectors.citta, clientData.citta);
    if (clientData.cap) cy.typeInto(this.selectors.cap, clientData.cap);
    if (clientData.stato === false) {
      cy.get(this.selectors.toggleStato).uncheck({ force: true });
    }
  }

  /**
   * Salva il form cliente
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
    cy.get(this.selectors.submitButton, { timeout: 10000 }).should('not.be.disabled');
  }

  /**
   * Verifica che appaia il messaggio di salvataggio
   */
  shouldShowSaveMessage() {
    cy.get(this.selectors.saveMessage, { timeout: 10000 }).should('contain', 'Salvato');
  }

  /**
   * Cerca un cliente nella tabella
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
   * Modifica un cliente dalla tabella
   * @param {string} identifier - Identificatore del cliente (codice)
   */
  editClient(identifier) {
    this.findTableRow(identifier);
    cy.get(this.selectors.dataTable)
      .contains('td', identifier)
      .closest('tr')
      .within(() => {
        cy.get(this.selectors.editButton).click();
      });
  }

  /**
   * Elimina un cliente dalla tabella
   * @param {string} identifier - Identificatore del cliente (codice)
   */
  deleteClient(identifier) {
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
    cy.get(this.selectors.dataTable).scrollIntoView().should('be.visible');
    cy.get(this.selectors.dataTable).contains('th', 'Codice').should('be.visible');
    cy.get(this.selectors.dataTable).contains('th', 'Ragione Sociale').should('be.visible');
    cy.get(this.selectors.dataTable).contains('th', 'P.IVA').should('be.visible');
    cy.get(this.selectors.dataTable).contains('th', 'Email').should('be.visible');
    cy.get(this.selectors.dataTable).contains('th', 'Azioni').scrollIntoView().should('be.visible');
  }

  /**
   * Verifica che il pulsante Nuovo Cliente sia visibile
   */
  shouldHaveNewClientButton() {
    cy.get(this.selectors.newEntityButton).should('be.visible');
    cy.get(this.selectors.newEntityButton).should('contain', 'Nuovo Cliente');
  }

  /**
   * Cambia tab nella sidebar
   * @param {string} tabName - Nome del tab ('anagrafica', 'attachments', 'note', 'azioni')
   */
  switchTab(tabName) {
    const tabMap = {
      anagrafica: this.selectors.tabAnagrafica,
      attachments: this.selectors.tabAttachments,
      note: this.selectors.tabNote,
      azioni: this.selectors.tabAzioni
    };
    cy.get(tabMap[tabName]).click();
  }

  /**
   * Verifica che un tab sia visibile
   * @param {string} tabName - Nome del tab
   */
  shouldTabBeVisible(tabName) {
    const tabMap = {
      anagrafica: this.selectors.tabAnagrafica,
      attachments: this.selectors.tabAttachments,
      note: this.selectors.tabNote,
      azioni: this.selectors.tabAzioni
    };
    cy.get(tabMap[tabName]).should('be.visible');
  }

  /**
   * Verifica che un tab non sia visibile
   * @param {string} tabName - Nome del tab
   */
  shouldTabNotBeVisible(tabName) {
    const tabMap = {
      anagrafica: this.selectors.tabAnagrafica,
      attachments: this.selectors.tabAttachments,
      note: this.selectors.tabNote,
      azioni: this.selectors.tabAzioni
    };
    cy.get(tabMap[tabName]).should('not.be.visible');
  }

  /**
   * Verifica che un tab sia attivo
   * @param {string} tabName - Nome del tab
   */
  shouldTabBeActive(tabName) {
    const buttonMap = {
      anagrafica: this.selectors.tabAnagraficaButton,
      attachments: this.selectors.tabAttachmentsButton,
      note: this.selectors.tabNoteButton,
      azioni: this.selectors.tabAzioniButton
    };
    const tabMap = {
      anagrafica: this.selectors.tabAnagrafica,
      attachments: this.selectors.tabAttachments,
      note: this.selectors.tabNote,
      azioni: this.selectors.tabAzioni
    };
    cy.get(buttonMap[tabName]).should('have.class', 'active');
    cy.get(tabMap[tabName]).should('have.class', 'active');
  }

  /**
   * Verifica che un tab non sia attivo
   * @param {string} tabName - Nome del tab
   */
  shouldTabNotBeActive(tabName) {
    const buttonMap = {
      anagrafica: this.selectors.tabAnagraficaButton,
      attachments: this.selectors.tabAttachmentsButton,
      note: this.selectors.tabNoteButton,
      azioni: this.selectors.tabAzioniButton
    };
    cy.get(buttonMap[tabName]).should('not.have.class', 'active');
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

  /**
   * Verifica che i campi obbligatori abbiano l'attributo required
   */
  shouldHaveRequiredFields() {
    cy.get(this.selectors.codice).should('have.attr', 'required');
    cy.get(this.selectors.ragioneSociale).should('have.attr', 'required');
    cy.get(this.selectors.email).should('have.attr', 'required');
  }

  /**
   * Verifica che il toggle stato sia checked
   */
  shouldToggleStatoBeChecked() {
    cy.get(this.selectors.toggleStato).should('be.checked');
  }

  /**
   * Verifica che il form sia resettato
   */
  shouldFormBeReset() {
    cy.get(this.selectors.codice).should('have.value', '');
    cy.get(this.selectors.ragioneSociale).should('have.value', '');
    cy.get(this.selectors.email).should('have.value', '');
  }

  /**
   * Verifica i valori dei campi del form
   * @param {object} expectedValues - Valori attesi
   */
  shouldHaveFormValues(expectedValues) {
    if (expectedValues.ragioneSociale) {
      cy.get(this.selectors.ragioneSociale).should('have.value', expectedValues.ragioneSociale);
    }
    if (expectedValues.piva) {
      cy.get(this.selectors.piva).should('have.value', expectedValues.piva);
    }
    if (expectedValues.telefono) {
      cy.get(this.selectors.telefono).should('have.value', expectedValues.telefono);
    }
    if (expectedValues.indirizzo) {
      cy.get(this.selectors.indirizzo).should('have.value', expectedValues.indirizzo);
    }
    if (expectedValues.citta) {
      cy.get(this.selectors.citta).should('have.value', expectedValues.citta);
    }
    if (expectedValues.cap) {
      cy.get(this.selectors.cap).should('have.value', expectedValues.cap);
    }
  }

  /**
   * Clicca sulla tabella per chiudere la sidebar
   */
  clickOnTable() {
    cy.get(this.selectors.dataTable).click();
  }
}
