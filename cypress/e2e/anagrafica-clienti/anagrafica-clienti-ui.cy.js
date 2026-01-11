describe('Anagrafica Clienti - UI e Sidebar', () => {
  const credentials = {
    email: `admin.ui.${Date.now()}@test.local`,
    password: 'AdminPass123!'
  };

  before(() => {
    cy.seedAdmin(credentials.email, credentials.password);
  });

  beforeEach(() => {
    cy.login(credentials.email, credentials.password);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });
  });

  describe('Tabella', () => {
    it('dovrebbe visualizzare le colonne corrette', () => {
      cy.get('#data-table').scrollIntoView().should('be.visible');
      cy.get('#data-table').contains('th', 'Codice').should('be.visible');
      cy.get('#data-table').contains('th', 'Ragione Sociale').should('be.visible');
      cy.get('#data-table').contains('th', 'P.IVA').should('be.visible');
      cy.get('#data-table').contains('th', 'Email').should('be.visible');
      cy.get('#data-table').contains('th', 'Azioni').scrollIntoView().should('be.visible');
    });

    it('dovrebbe avere il pulsante Nuovo Cliente', () => {
      cy.get('#new-entity-btn').should('be.visible');
      cy.get('#new-entity-btn').should('contain', 'Nuovo Cliente');
    });

    it('dovrebbe filtrare i risultati con la ricerca', () => {
      cy.get('#new-entity-btn').click();

      const codiceCliente = `CLI-SEARCH-${Date.now()}`;
      cy.typeInto('#codice', codiceCliente);
      cy.typeInto('#ragione_sociale', 'Test Ricerca SRL');
      cy.typeInto('#email', `search.${Date.now()}@test.local`);
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
      cy.get('#close-sidebar-btn').click();

      cy.findDataTableRow(codiceCliente);
      cy.get('#data-table').contains('Test Ricerca SRL').should('be.visible');
    });
  });

  describe('Sidebar - Apertura e Chiusura', () => {
    it('dovrebbe aprire la sidebar al click su Nuovo Cliente', () => {
      cy.get('#entity-form-sidebar').should('not.have.class', 'open');
      cy.get('#new-entity-btn').click();
      cy.get('#entity-form-sidebar').should('have.class', 'open');
    });

    it('dovrebbe mostrare il titolo "Nuovo Cliente"', () => {
      cy.get('#new-entity-btn').click();
      cy.get('#entity-form-title').should('contain', 'Nuovo Cliente');
    });

    it('dovrebbe chiudere la sidebar con il bottone X', () => {
      cy.get('#new-entity-btn').click();
      cy.get('#entity-form-sidebar').should('have.class', 'open');
      cy.get('#close-sidebar-btn').click();
      cy.get('#entity-form-sidebar').should('not.have.class', 'open');
    });

    it('dovrebbe chiudere la sidebar al click sulla tabella', () => {
      cy.get('#new-entity-btn').click();
      cy.get('#entity-form-sidebar').should('have.class', 'open');
      cy.get('#data-table').click();
      cy.get('#entity-form-sidebar').should('not.have.class', 'open');
    });

    it('dovrebbe cambiare titolo quando si modifica un cliente', () => {
      cy.get('#new-entity-btn').click();

      const codiceCliente = `CLI-TITLE-${Date.now()}`;
      const ragioneSociale = 'Test Titolo SRL';
      cy.typeInto('#codice', codiceCliente);
      cy.typeInto('#ragione_sociale', ragioneSociale);
      cy.typeInto('#email', `title.${Date.now()}@test.local`);
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
      cy.get('#close-sidebar-btn').click();

      cy.findDataTableRow(codiceCliente);
      cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
        cy.get('.btn-edit').click();
      });

      cy.get('#entity-form-title').should('contain', ragioneSociale);
    });
  });

  describe('Sidebar - Tab per Nuovo Cliente', () => {
    it('dovrebbe nascondere i tab Documenti, Note e Azioni per nuovo cliente', () => {
      cy.get('#new-entity-btn').click();

      cy.get('[data-tab="anagrafica"]').should('be.visible');
      cy.get('[data-tab="attachments"]').should('not.be.visible');
      cy.get('[data-tab="note"]').should('not.be.visible');
      cy.get('[data-tab="azioni"]').should('not.be.visible');
    });

    it('dovrebbe mostrare tutti i tab per cliente esistente', () => {
      cy.get('#new-entity-btn').click();

      const codiceCliente = `CLI-TABS-${Date.now()}`;
      cy.typeInto('#codice', codiceCliente);
      cy.typeInto('#ragione_sociale', 'Test Tab SRL');
      cy.typeInto('#email', `tabs.${Date.now()}@test.local`);
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

      cy.get('[data-tab="anagrafica"]').scrollIntoView().should('be.visible');
      cy.get('[data-tab="attachments"]').should('be.visible');
      cy.get('[data-tab="note"]').should('be.visible');
      cy.get('[data-tab="azioni"]').should('be.visible');
    });
  });

  describe('Sidebar - Navigazione Tab', () => {
    it('dovrebbe cambiare tab al click', () => {
      cy.get('#new-entity-btn').click();

      const codiceCliente = `CLI-NAV-${Date.now()}`;
      cy.typeInto('#codice', codiceCliente);
      cy.typeInto('#ragione_sociale', 'Test Nav SRL');
      cy.typeInto('#email', `nav.${Date.now()}@test.local`);
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

      cy.get('#tab-anagrafica').should('have.class', 'active');
      cy.get('[data-tab="anagrafica"]').should('have.class', 'active');

      cy.get('[data-tab="attachments"]').click();
      cy.get('#tab-attachments').should('have.class', 'active');
      cy.get('[data-tab="attachments"]').should('have.class', 'active');
      cy.get('#tab-anagrafica').should('not.have.class', 'active');

      cy.get('[data-tab="note"]').click();
      cy.get('#tab-note').should('have.class', 'active');
      cy.get('[data-tab="note"]').should('have.class', 'active');
      cy.get('#tab-attachments').should('not.have.class', 'active');

      cy.get('[data-tab="azioni"]').click();
      cy.get('#tab-azioni').should('have.class', 'active');
      cy.get('[data-tab="azioni"]').should('have.class', 'active');
      cy.get('#tab-note').should('not.have.class', 'active');
    });

    it('dovrebbe tornare al primo tab quando si apre nuovo cliente', () => {
      cy.get('#new-entity-btn').click();

      const codiceCliente = `CLI-RESET-${Date.now()}`;
      cy.typeInto('#codice', codiceCliente);
      cy.typeInto('#ragione_sociale', 'Test Reset SRL');
      cy.typeInto('#email', `reset.${Date.now()}@test.local`);
      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

      cy.get('[data-tab="azioni"]').click();
      cy.get('#tab-azioni').should('have.class', 'active');

      cy.get('#close-sidebar-btn').click();
      cy.get('#new-entity-btn').click();

      cy.get('#tab-anagrafica').should('have.class', 'active');
      cy.get('[data-tab="anagrafica"]').should('have.class', 'active');
    });
  });

  describe('Form - Validazione e Stato', () => {
    it('dovrebbe validare i campi obbligatori', () => {
      cy.get('#new-entity-btn').click();

      cy.get('#codice').should('have.attr', 'required');
      cy.get('#ragione_sociale').should('have.attr', 'required');
      cy.get('#email').should('have.attr', 'required');
    });

    it('dovrebbe avere il toggle Attivo checked di default', () => {
      cy.get('#new-entity-btn').click();
      cy.get('#toggle-stato').should('be.checked');
    });

    it('dovrebbe resettare il form quando si apre Nuovo Cliente', () => {
      cy.get('#new-entity-btn').click();

      cy.typeInto('#codice', 'TEST123');
      cy.typeInto('#ragione_sociale', 'Test');
      cy.typeInto('#email', 'test@test.local');

      cy.get('#close-sidebar-btn').click();
      cy.get('#new-entity-btn').click();

      cy.get('#codice').should('have.value', '');
      cy.get('#ragione_sociale').should('have.value', '');
      cy.get('#email').should('have.value', '');
    });

    it('dovrebbe disabilitare il bottone Salva durante il salvataggio', () => {
      cy.get('#new-entity-btn').click();

      const codiceCliente = `CLI-BTN-${Date.now()}`;
      cy.typeInto('#codice', codiceCliente);
      cy.typeInto('#ragione_sociale', 'Test Button SRL');
      cy.typeInto('#email', `button.${Date.now()}@test.local`);

      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('button[type="submit"][form="entity-form"]').should('be.disabled');
      cy.get('button[type="submit"][form="entity-form"]', { timeout: 10000 }).should('not.be.disabled');
    });

    it('dovrebbe mostrare il messaggio di salvataggio', () => {
      cy.get('#new-entity-btn').click();

      const codiceCliente = `CLI-MSG-${Date.now()}`;
      cy.typeInto('#codice', codiceCliente);
      cy.typeInto('#ragione_sociale', 'Test Message SRL');
      cy.typeInto('#email', `message.${Date.now()}@test.local`);

      cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
      cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);
    });
  });
});
