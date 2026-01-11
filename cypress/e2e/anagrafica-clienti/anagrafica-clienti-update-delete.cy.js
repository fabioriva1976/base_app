import { AnagraficaClientiPage } from '../../pages/AnagraficaClientiPage.js';

describe('Anagrafica Clienti - update e delete', () => {
  const clientiPage = new AnagraficaClientiPage();

  before(() => {
    cy.clearAllClienti();
  });

  it('dovrebbe aggiornare un cliente e mostrare le azioni', () => {
    const adminEmail = `admin.update.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-UPD-${Date.now()}`;
    const emailCliente = `cliente.update.${Date.now()}@test.local`;

    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Azienda Originale SRL',
      email: emailCliente,
      piva: '11111111111',
      telefono: '+39 333 1111111'
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.shouldShowSaveMessage();

    clientiPage.switchTab('azioni');
    clientiPage.shouldHaveAction('Creazione');

    clientiPage.closeSidebar();
    clientiPage.waitForTableSync(codiceCliente, { exists: true });
    clientiPage.editClient(codiceCliente);

    clientiPage.fillClientForm({
      ragioneSociale: 'Azienda Modificata SRL',
      piva: '22222222222',
      telefono: '+39 333 2222222'
    });

    clientiPage.submitForm();
    clientiPage.shouldSubmitBeDisabled();
    clientiPage.shouldSubmitBeEnabled();

    clientiPage.closeSidebar();
    clientiPage.editClient(codiceCliente);
    clientiPage.switchTab('azioni');
    clientiPage.shouldHaveAction('Modifica');
  });

  it('dovrebbe eliminare un cliente creato', () => {
    const adminEmail = `admin.delete.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-DEL-${Date.now()}`;
    const emailCliente = `cliente.delete.${Date.now()}@test.local`;

    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Azienda da Eliminare SRL',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.shouldShowSaveMessage();
    clientiPage.closeSidebar();

    clientiPage.deleteClient(codiceCliente);
    clientiPage.confirmDelete();
    clientiPage.waitForTableSync(codiceCliente, { exists: false });
  });

  it('dovrebbe annullare la cancellazione di un cliente', () => {
    const adminEmail = `admin.cancel.${Date.now()}@test.local`;
    const adminPassword = 'AdminPass123!';

    cy.seedAdmin(adminEmail, adminPassword);
    cy.login(adminEmail, adminPassword);

    clientiPage.visitPage();
    clientiPage.openNewClientSidebar();

    const codiceCliente = `CLI-CANCEL-${Date.now()}`;
    const emailCliente = `cliente.cancel.${Date.now()}@test.local`;

    clientiPage.fillClientForm({
      codice: codiceCliente,
      ragioneSociale: 'Azienda Non Eliminare SRL',
      email: emailCliente
    });

    clientiPage.submitForm();
    clientiPage.waitForSaveComplete();
    clientiPage.shouldShowSaveMessage();
    clientiPage.closeSidebar();

    clientiPage.waitForTableSync(codiceCliente, { exists: true });
    clientiPage.deleteClient(codiceCliente);
    clientiPage.cancelDelete();
    clientiPage.waitForTableSync(codiceCliente, { exists: true });
  });
});
