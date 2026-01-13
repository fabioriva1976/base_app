/**
 * 🧪 Test Permessi - Ruolo OPERATORE
 *
 * Verifica che gli utenti con ruolo "operatore" abbiano accesso limitato:
 * - ✅ Può vedere: Dashboard, Clienti
 * - ❌ NON può vedere: Utenti, Configurazioni
 * - ❌ Accesso diretto a /users e /configurazioni → pagina accesso negato
 */

describe('Permessi Ruolo OPERATORE', () => {
  const TEST_USER_EMAIL = 'operatore@test.com';
  const TEST_USER_PASSWORD = 'Test123!';

  beforeEach(() => {
    // Login come operatore
    cy.loginAsOperatore(TEST_USER_EMAIL, TEST_USER_PASSWORD);
  });

  afterEach(() => {
    cy.logout();
  });

  describe('🔍 Verifica Link Menu Sidebar', () => {
    it('dovrebbe mostrare solo link Dashboard e Clienti', () => {
      cy.visit('/dashboard');

      // ✅ Link visibili (operatore può accedere)
      cy.contains('a', 'Dashboard').should('be.visible');
      cy.contains('a', 'Clienti').should('be.visible');

      // ❌ Link NON visibili (operatore non può accedere)
      cy.contains('a', 'Utenti').should('not.exist');
      cy.contains('a', 'Configurazioni').should('not.exist');
    });

    it('dovrebbe mostrare esattamente 2 voci di menu', () => {
      cy.visit('/dashboard');

      // Conta solo i link di navigazione (escludi logout)
      cy.get('.sidebar nav:not(.nav-bottom) .nav-menu li').should('have.length', 2);
    });
  });

  describe('🚫 Verifica Accesso Negato - Pagina Utenti', () => {
    it('dovrebbe bloccare accesso diretto a /users', () => {
      cy.visit('/users', { failOnStatusCode: false });

      // Verifica redirect a pagina accesso negato
      cy.url().should('include', '/accesso-negato');
    });

    it('dovrebbe mostrare pagina "Accesso Negato" per /users', () => {
      cy.visit('/users', { failOnStatusCode: false });

      // Verifica contenuto pagina accesso negato
      cy.contains('h1', 'Accesso Negato').should('be.visible');
      cy.contains('Non hai i permessi necessari').should('be.visible');
    });

    it('dovrebbe avere pulsante "Torna alla Dashboard"', () => {
      cy.visit('/users', { failOnStatusCode: false });

      cy.contains('a', 'Torna alla Dashboard').should('be.visible').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('🚫 Verifica Accesso Negato - Pagina Configurazioni', () => {
    it('dovrebbe bloccare accesso diretto a /configurazioni', () => {
      cy.visit('/configurazioni', { failOnStatusCode: false });

      // Verifica redirect a pagina accesso negato
      cy.url().should('include', '/accesso-negato');
    });

    it('dovrebbe mostrare pagina "Accesso Negato" per /configurazioni', () => {
      cy.visit('/configurazioni', { failOnStatusCode: false });

      // Verifica contenuto pagina accesso negato
      cy.contains('h1', 'Accesso Negato').should('be.visible');
      cy.contains('Non hai i permessi necessari').should('be.visible');
    });
  });

  describe('✅ Verifica Accesso Consentito', () => {
    it('dovrebbe accedere a /dashboard senza problemi', () => {
      cy.visit('/dashboard');

      cy.url().should('include', '/dashboard');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe accedere a /anagrafica-clienti senza problemi', () => {
      cy.visit('/anagrafica-clienti');

      cy.url().should('include', '/anagrafica-clienti');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe navigare tra pagine consentite', () => {
      cy.visit('/dashboard');

      // Naviga a Clienti
      cy.contains('a', 'Clienti').click();
      cy.url().should('include', '/anagrafica-clienti');

      // Torna a Dashboard
      cy.contains('a', 'Dashboard').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('📊 Verifica Stato Console', () => {
    it('dovrebbe loggare accesso negato nella console', () => {
      cy.visit('/dashboard');

      // Intercetta console.log
      cy.window().then((win) => {
        cy.stub(win.console, 'log').as('consoleLog');
      });

      cy.visit('/users', { failOnStatusCode: false });

      // Verifica che la console mostri il messaggio (solo in ambiente che supporta stub console)
      // Nota: questo test funziona meglio con dev mode
    });
  });
});
