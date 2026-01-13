/**
 * 🧪 Test Permessi - Ruolo ADMIN
 *
 * Verifica che gli utenti con ruolo "admin" abbiano accesso esteso:
 * - ✅ Può vedere: Dashboard, Clienti, Utenti (nel menu profilo)
 * - ❌ NON può vedere: Configurazioni (solo superuser)
 * - ❌ Accesso diretto a /settings-* → pagina accesso negato
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
    it('dovrebbe mostrare solo Dashboard e Clienti nel menu principale', () => {
      cy.visit('/dashboard');

      // ✅ Link visibili (menu principale)
      cy.contains('a', 'Dashboard').should('be.visible');
      cy.contains('a', 'Clienti').should('be.visible');

      // ❌ Link non presenti nel menu principale
      cy.contains('a', 'Utenti').should('not.exist');
      cy.contains('a', 'SMTP').should('not.exist');
      cy.contains('a', 'Agenti AI').should('not.exist');
    });

    it('dovrebbe mostrare esattamente 2 voci di menu', () => {
      cy.visit('/dashboard');

      // Conta solo i link di navigazione (escludi logout)
      cy.get('.sidebar nav:not(.nav-bottom) .nav-menu li').should('have.length', 2);
    });
  });

  describe('🔍 Verifica Link Menu Profilo', () => {
    it('dovrebbe mostrare Utenti ma non Configurazioni', () => {
      cy.visit('/profile');

      // ✅ Link visibili (menu profilo)
      cy.contains('a', 'Il Mio Profilo').should('be.visible');
      cy.contains('a', 'Utenti').should('be.visible');

      // ❌ Link non visibili (solo superuser)
      cy.contains('a', 'SMTP').should('not.exist');
      cy.contains('a', 'Agenti AI').should('not.exist');
    });

    it('dovrebbe mostrare esattamente 2 voci nel menu profilo', () => {
      cy.visit('/profile');

      cy.get('.sidebar nav:not(.nav-bottom) .nav-menu li').should('have.length', 2);
    });
  });

  describe('✅ Verifica Accesso Utenti', () => {
    it('dovrebbe accedere a /users senza problemi', () => {
      cy.visit('/users');

      cy.url().should('include', '/users');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe cliccare su link Utenti nel menu', () => {
      cy.visit('/profile');

      cy.contains('a', 'Utenti').click();
      cy.url().should('include', '/users');
    });
  });

  describe('🚫 Verifica Accesso Negato - Configurazioni', () => {
    it('dovrebbe bloccare accesso diretto a /settings-smtp', () => {
      cy.visit('/settings-smtp', { failOnStatusCode: false });

      // Verifica redirect a pagina accesso negato
      cy.url().should('include', '/accesso-negato');
    });

    it('dovrebbe mostrare pagina "Accesso Negato" per /settings-smtp', () => {
      cy.visit('/settings-smtp', { failOnStatusCode: false });

      // Verifica contenuto pagina accesso negato
      cy.contains('h1', 'Accesso Negato').should('be.visible');
      cy.contains('Non hai i permessi necessari').should('be.visible');
    });

    it('dovrebbe avere pulsante "Torna alla Dashboard"', () => {
      cy.visit('/settings-smtp', { failOnStatusCode: false });

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

      // Clienti → Profilo
      cy.get('#profile-toggle').click();
      cy.url().should('include', '/profile');

      // Profilo → Utenti
      cy.contains('a', 'Utenti').click();
      cy.url().should('include', '/users');

      // Utenti → Dashboard (torna all'app dal menu profilo)
      cy.get('#back-to-app-btn').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('🔒 Confronto con Operatore', () => {
    it('admin dovrebbe avere più permessi di operatore', () => {
      cy.visit('/dashboard');

      // Admin vede "Utenti" nel menu profilo (operatore no)
      cy.visit('/profile');
      cy.contains('a', 'Utenti').should('be.visible');

      // Verifica che può accedervi
      cy.visit('/users');
      cy.url().should('include', '/users');
      cy.url().should('not.include', '/accesso-negato');
    });
  });
});
