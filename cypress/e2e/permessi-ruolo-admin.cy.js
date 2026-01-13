/**
 * 🧪 Test Permessi - Ruolo ADMIN
 *
 * Verifica che gli utenti con ruolo "admin" abbiano accesso esteso:
 * - ✅ Può vedere: Dashboard, Clienti, Utenti
 * - ❌ NON può vedere: Configurazioni (solo superuser)
 * - ❌ Accesso diretto a /configurazioni → pagina accesso negato
 */

describe('Permessi Ruolo ADMIN', () => {
  const TEST_USER_EMAIL = 'admin@test.com';
  const TEST_USER_PASSWORD = 'Test123!';

  beforeEach(() => {
    // Login come admin
    cy.loginAsAdmin(TEST_USER_EMAIL, TEST_USER_PASSWORD);
  });

  afterEach(() => {
    cy.logout();
  });

  describe('🔍 Verifica Link Menu Sidebar', () => {
    it('dovrebbe mostrare link Dashboard, Clienti e Utenti', () => {
      cy.visit('/dashboard');

      // ✅ Link visibili (admin può accedere)
      cy.contains('a', 'Dashboard').should('be.visible');
      cy.contains('a', 'Clienti').should('be.visible');
      cy.contains('a', 'Utenti').should('be.visible');

      // ❌ Link NON visibile (solo superuser)
      cy.contains('a', 'Configurazioni').should('not.exist');
    });

    it('dovrebbe mostrare esattamente 3 voci di menu', () => {
      cy.visit('/dashboard');

      // Conta solo i link di navigazione (escludi logout)
      cy.get('.sidebar nav:not(.nav-bottom) .nav-menu li').should('have.length', 3);
    });
  });

  describe('✅ Verifica Accesso Utenti', () => {
    it('dovrebbe accedere a /users senza problemi', () => {
      cy.visit('/users');

      cy.url().should('include', '/users');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe cliccare su link Utenti nel menu', () => {
      cy.visit('/dashboard');

      cy.contains('a', 'Utenti').click();
      cy.url().should('include', '/users');
    });
  });

  describe('🚫 Verifica Accesso Negato - Configurazioni', () => {
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

    it('dovrebbe avere pulsante "Torna alla Dashboard"', () => {
      cy.visit('/configurazioni', { failOnStatusCode: false });

      cy.contains('a', 'Torna alla Dashboard').should('be.visible').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('✅ Verifica Accesso Consentito', () => {
    it('dovrebbe accedere a tutte le pagine consentite', () => {
      // Dashboard
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      cy.url().should('not.include', '/accesso-negato');

      // Clienti
      cy.visit('/anagrafica-clienti');
      cy.url().should('include', '/anagrafica-clienti');
      cy.url().should('not.include', '/accesso-negato');

      // Utenti
      cy.visit('/users');
      cy.url().should('include', '/users');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe navigare tra tutte le pagine consentite', () => {
      cy.visit('/dashboard');

      // Dashboard → Clienti
      cy.contains('a', 'Clienti').click();
      cy.url().should('include', '/anagrafica-clienti');

      // Clienti → Utenti
      cy.contains('a', 'Utenti').click();
      cy.url().should('include', '/users');

      // Utenti → Dashboard
      cy.contains('a', 'Dashboard').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('🔒 Confronto con Operatore', () => {
    it('admin dovrebbe avere più permessi di operatore', () => {
      cy.visit('/dashboard');

      // Admin vede "Utenti" (operatore no)
      cy.contains('a', 'Utenti').should('be.visible');

      // Verifica che può accedervi
      cy.visit('/users');
      cy.url().should('include', '/users');
      cy.url().should('not.include', '/accesso-negato');
    });
  });
});
