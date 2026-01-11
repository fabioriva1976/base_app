describe('Anagrafica Clienti - Note', () => {
  it('dovrebbe aggiungere una nota a un cliente', () => {
    const adminEmail = `admin.note.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `note.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Test Note SRL');
    cy.typeInto('#piva', '11111111111');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="note"]').click();
    cy.get('#tab-note').should('be.visible');

    const notaText = 'Cliente molto importante, richiamare entro fine mese';
    cy.typeInto('#comment-text', notaText);
    cy.get('#save-comment-btn').click();

    cy.get('.comment-item', { timeout: 10000 }).should('be.visible');
    cy.get('.comment-body').should('contain', notaText);
    cy.get('.comment-user').should('be.visible');
    cy.get('.comment-date').should('be.visible');

    cy.get('[data-tab="azioni"]').click();
    cy.get('#action-list', { timeout: 20000 }).should('be.visible');
  });

  it('dovrebbe visualizzare note multiple in ordine cronologico', () => {
    const adminEmail = `admin.multinote.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `multinote.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Test Multi Note SRL');
    cy.typeInto('#piva', '22222222222');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="note"]').click();

    const nota1 = 'Prima nota del cliente';
    cy.typeInto('#comment-text', nota1);
    cy.get('#save-comment-btn').click();
    cy.get('.comment-item', { timeout: 10000 }).should('have.length', 1);

    cy.wait(1000);

    const nota2 = 'Seconda nota del cliente';
    cy.typeInto('#comment-text', nota2);
    cy.get('#save-comment-btn').click();
    cy.get('.comment-item', { timeout: 10000 }).should('have.length', 2);

    cy.wait(1000);

    const nota3 = 'Terza nota del cliente';
    cy.typeInto('#comment-text', nota3);
    cy.get('#save-comment-btn').click();
    cy.get('.comment-item', { timeout: 10000 }).should('have.length', 3);

    cy.get('.comment-item').first().find('.comment-body').should('contain', nota3);
    cy.get('.comment-item').last().find('.comment-body').should('contain', nota1);
  });

  it('dovrebbe visualizzare nota vuota quando non ci sono note', () => {
    const adminEmail = `admin.emptynote.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `emptynote.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Senza Note SRL');
    cy.typeInto('#piva', '33333333333');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="note"]').click();
    cy.get('#comment-list').find('.empty-state').should('be.visible');
    cy.get('.comment-item').should('not.exist');
  });

  it('dovrebbe mantenere le note quando si riapre il cliente', () => {
    const adminEmail = `admin.persistnote.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `persistnote.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Persist Note SRL');
    cy.typeInto('#piva', '44444444444');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="note"]').click();

    const notaText = 'Questa nota deve persistere';
    cy.typeInto('#comment-text', notaText);
    cy.get('#save-comment-btn').click();
    cy.get('.comment-item', { timeout: 10000 }).should('be.visible');

    cy.get('#close-sidebar-btn').click();
    cy.searchDataTable(codiceCliente);
    cy.get('#data-table').contains('td', codiceCliente).closest('tr').within(() => {
      cy.get('.btn-edit').click();
    });

    cy.get('[data-tab="note"]').click();
    cy.get('.comment-item', { timeout: 10000 }).should('be.visible');
    cy.get('.comment-body').should('contain', notaText);
  });

  it('dovrebbe pulire il campo testo dopo aver salvato una nota', () => {
    const adminEmail = `admin.clearnote.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `clearnote.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Clear Note SRL');
    cy.typeInto('#piva', '55555555555');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="note"]').click();

    const notaText = 'Nota di prova';
    cy.typeInto('#comment-text', notaText);
    cy.get('#save-comment-btn').click();
    cy.get('.comment-item', { timeout: 10000 }).should('be.visible');

    cy.get('#comment-text').should('have.value', '');
  });

  it('dovrebbe mostrare autore e data nelle note', () => {
    const adminEmail = `admin.metadata.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    cy.visit('/anagrafica-clienti', { failOnStatusCode: false });

    cy.get('#new-entity-btn').click();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `metanote.${Date.now()}@test.local`;
    cy.typeInto('#codice', codiceCliente);
    cy.typeInto('#ragione_sociale', 'Cliente Metadata Note SRL');
    cy.typeInto('#piva', '66666666666');
    cy.typeInto('#email', emailCliente);

    cy.get('button[type="submit"][form="entity-form"]').scrollIntoView().click({ force: true });
    cy.get('#entity-id', { timeout: 10000 }).invoke('val').should('match', /.+/);

    cy.get('[data-tab="note"]').click();

    const notaText = 'Nota con metadata';
    cy.typeInto('#comment-text', notaText);
    cy.get('#save-comment-btn').click();

    cy.get('.comment-item', { timeout: 10000 }).should('be.visible');
    cy.get('.comment-user').should('not.be.empty');
    cy.get('.comment-date').should('not.be.empty');
    cy.get('.comment-body').should('contain', notaText);
  });
});
