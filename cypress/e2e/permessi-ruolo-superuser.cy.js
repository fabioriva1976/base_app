/**
 * 🧪 Test Permessi - Ruolo SUPERUSER
 *
 * Verifica che gli utenti con ruolo "superuser" abbiano accesso completo:
 * - ✅ Può vedere: Dashboard, Clienti (menu principale), Utenti e Configurazioni (menu profilo)
 * - ✅ Nessuna restrizione
 * - ✅ Accesso a tutte le pagine senza limitazioni
 */

describe('Permessi Ruolo SUPERUSER', () => {
  const TEST_USER_EMAIL = 'superuser@test.com';
  const TEST_USER_PASSWORD = 'Test123!';

  beforeEach(() => {
    // Login come superuser
    cy.loginAsSuperuser(TEST_USER_EMAIL, TEST_USER_PASSWORD);
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
    it('dovrebbe mostrare Utenti e Configurazioni', () => {
      cy.visit('/profile');

      // ✅ Link visibili (menu profilo)
      cy.contains('a', 'Il Mio Profilo').should('be.visible');
      cy.contains('a', 'Utenti').should('be.visible');
      cy.contains('a', 'SMTP').should('be.visible');
      cy.contains('a', 'Agenti AI').should('be.visible');
    });

    it('dovrebbe mostrare esattamente 4 voci nel menu profilo', () => {
      cy.visit('/profile');

      cy.get('.sidebar nav:not(.nav-bottom) .nav-menu li').should('have.length', 4);
    });
  });

  describe('✅ Verifica Accesso Completo - Tutte le Pagine', () => {
    it('dovrebbe accedere a /dashboard', () => {
      cy.visit('/dashboard');

      cy.url().should('include', '/dashboard');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe accedere a /anagrafica-clienti', () => {
      cy.visit('/anagrafica-clienti');

      cy.url().should('include', '/anagrafica-clienti');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe accedere a /users', () => {
      cy.visit('/users');

      cy.url().should('include', '/users');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe accedere a /settings-smtp', () => {
      cy.visit('/settings-smtp');

      cy.url().should('include', '/settings-smtp');
      cy.url().should('not.include', '/accesso-negato');
    });
  });

  describe('🚀 Verifica Navigazione Completa', () => {
    it('dovrebbe navigare tra tutte le pagine senza restrizioni', () => {
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

    it('dovrebbe accedere a ogni pagina direttamente tramite URL', () => {
      const pages = [
        '/dashboard',
        '/anagrafica-clienti',
        '/users',
        '/settings-smtp',
        '/settings-ai'
      ];

      pages.forEach((page) => {
        cy.visit(page);
        cy.url().should('include', page);
        cy.url().should('not.include', '/accesso-negato');
      });
    });
  });

  describe('🔒 Confronto con Altri Ruoli', () => {
    it('superuser dovrebbe avere più permessi di admin', () => {
      cy.visit('/profile');

      // Superuser vede configurazioni (admin no)
      cy.contains('a', 'SMTP').should('be.visible');
      cy.contains('a', 'Agenti AI').should('be.visible');

      // Verifica accesso effettivo
      cy.visit('/settings-smtp');
      cy.url().should('include', '/settings-smtp');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('superuser non dovrebbe mai vedere pagina accesso negato', () => {
      const protectedPages = [
        '/users',
        '/settings-smtp',
        '/settings-ai',
        '/settings',
        '/audit-logs'
      ];

      protectedPages.forEach((page) => {
        cy.visit(page, { failOnStatusCode: false });

        // Superuser può accedere ovunque (tranne 404)
        cy.url().should('not.include', '/accesso-negato');
      });
    });
  });

  describe('🎛️ Verifica Permessi Speciali', () => {
    it('dovrebbe avere accesso a funzionalità admin avanzate', () => {
      cy.visit('/users');

      // Verifica che la pagina utenti sia accessibile
      cy.url().should('include', '/users');

      // Note: Test specifici per funzionalità admin dipendono dall'implementazione
      // Es: pulsante "Crea Superuser" visibile solo a superuser
    });

    it('dovrebbe accedere a tutte le rotte protette', () => {
      cy.visit('/profile');

      // Verifica numero di voci menu (superuser ha tutti i link nel profilo)
      cy.get('.sidebar nav:not(.nav-bottom) .nav-menu li').should('have.length', 4);
    });
  });

  describe('🧪 Test Robustezza', () => {
    it('dovrebbe mantenere permessi dopo refresh pagina', () => {
      cy.visit('/settings-smtp');
      cy.url().should('include', '/settings-smtp');

      // Refresh
      cy.reload();

      // Dovrebbe ancora essere su configurazioni
      cy.url().should('include', '/settings-smtp');
      cy.url().should('not.include', '/accesso-negato');
    });

    it('dovrebbe mantenere permessi navigando avanti/indietro', () => {
      cy.visit('/dashboard');
      cy.visit('/settings-smtp');

      // Indietro
      cy.go('back');
      cy.url().should('include', '/dashboard');

      // Avanti
      cy.go('forward');
      cy.url().should('include', '/settings-smtp');
      cy.url().should('not.include', '/accesso-negato');
    });
  });
});
