import { AnagraficaClientiPage } from '../../pages/AnagraficaClientiPage.js';

describe('Anagrafica Clienti - Note', () => {
  const clientiPage = new AnagraficaClientiPage();

  before(() => {
    cy.clearAllClienti();
  });

  it('dovrebbe aggiungere una nota a un cliente', () => {
    const adminEmail = `admin.note.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `note.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Test Note SRL',
      piva: '11111111111',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('note');

    const notaText = 'Cliente molto importante, richiamare entro fine mese';
    cy.typeInto('#comment-text', notaText);
    cy.get('#save-comment-btn').click();

    cy.get('.comment-item', { timeout: 10000 }).should('be.visible');
    cy.get('.comment-body').should('contain', notaText);
    cy.get('.comment-user').should('be.visible');
    cy.get('.comment-date').should('be.visible');

    clientiPage.switchTab('azioni');
    cy.get('#action-list', { timeout: 20000 }).should('be.visible');
  });

  it('dovrebbe visualizzare note multiple in ordine cronologico', () => {
    const adminEmail = `admin.multinote.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `multinote.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Test Multi Note SRL',
      piva: '22222222222',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('note');

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
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `emptynote.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Senza Note SRL',
      piva: '33333333333',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('note');

    cy.get('#comment-list').find('.empty-state').should('be.visible');
    cy.get('.comment-item').should('not.exist');
  });

  it('dovrebbe mantenere le note quando si riapre il cliente', () => {
    const adminEmail = `admin.persistnote.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `persistnote.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Persist Note SRL',
      piva: '44444444444',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('note');

    const notaText = 'Questa nota deve persistere';
    cy.typeInto('#comment-text', notaText);
    cy.get('#save-comment-btn').click();
    cy.get('#save-comment-btn', { timeout: 10000 }).should('not.be.disabled');
    cy.contains('.comment-body', notaText, { timeout: 10000 }).should('be.visible');

    clientiPage.closeSidebar();
    clientiPage.editClient(codiceCliente);
    clientiPage.switchTab('note');
    cy.contains('.comment-body', notaText, { timeout: 20000 }).should('be.visible');
  });

  it('dovrebbe pulire il campo testo dopo aver salvato una nota', () => {
    const adminEmail = `admin.clearnote.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `clearnote.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Clear Note SRL',
      piva: '55555555555',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('note');

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
    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-${Date.now()}`;
    const emailCliente = `metanote.${Date.now()}@test.local`;
    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Cliente Metadata Note SRL',
      piva: '66666666666',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.switchTab('note');

    const notaText = 'Nota con metadata';
    cy.typeInto('#comment-text', notaText);
    cy.get('#save-comment-btn').click();

    cy.get('.comment-item', { timeout: 10000 }).should('be.visible');
    cy.get('.comment-user').should('not.be.empty');
    cy.get('.comment-date').should('not.be.empty');
    cy.get('.comment-body').should('contain', notaText);
  });
});
