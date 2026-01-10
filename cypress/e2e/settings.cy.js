describe('Settings - AI e SMTP', () => {
  const apiKey = 'AIzaSyD8Wqok8hADg9bipYln3KpQbQ99nHVI-4s';
  const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'base-app-12108';
  const authEmulatorUrl = 'http://localhost:9099';
  const firestoreEmulatorUrl = 'http://localhost:8080';

  function createAuthUser(email, password) {
    return cy.request({
      method: 'POST',
      url: `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      body: {
        email,
        password,
        returnSecureToken: true
      },
      failOnStatusCode: false
    }).then((response) => ({
      uid: response.body.localId,
      idToken: response.body.idToken
    }));
  }

  function setUserRole(uid, role, idToken, email) {
    const now = new Date().toISOString();
    return cy.request({
      method: 'POST',
      url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${uid}`,
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      body: {
        fields: {
          email: {
            stringValue: email
          },
          status: {
            booleanValue: true
          },
          created: {
            stringValue: now
          },
          changed: {
            stringValue: now
          },
          lastModifiedBy: {
            stringValue: uid
          },
          lastModifiedByEmail: {
            stringValue: email
          },
          ruolo: {
            arrayValue: {
              values: [{ stringValue: role }]
            }
          }
        }
      },
      failOnStatusCode: false
    });
  }

  const credentials = {
    email: `superuser.${Date.now()}@test.local`,
    password: 'SuperPass123!'
  };

  before(() => {
    createAuthUser(credentials.email, credentials.password)
      .then(({ uid, idToken }) => setUserRole(uid, 'superuser', idToken, credentials.email));
  });

  function login() {
    cy.visit('/login', { failOnStatusCode: false });
    cy.get('#email').clear().type(credentials.email);
    cy.get('#password').clear().type(credentials.password);
    cy.get('#login-btn').click();
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  }

  it('dovrebbe salvare la configurazione AI', () => {
    login();

    cy.intercept('POST', '**/getConfigAiApi').as('getConfigAi');
    cy.visit('/settings-ai', { failOnStatusCode: false });
    cy.wait('@getConfigAi');

    const aiConfig = {
      provider: 'openai',
      apiKey: 'test-ai-key',
      model: 'gpt-4',
      temperature: '1.1',
      maxTokens: '1024',
      timeout: '15',
      systemPrompt: 'Prompt di test',
      ragCorpusId: '12345',
      ragLocation: 'europe-west1'
    };

    cy.get('#ai-provider').select(aiConfig.provider);
    cy.get('#ai-api-key').clear().type(aiConfig.apiKey);
    cy.get('#ai-model').select(aiConfig.model);
    cy.get('#ai-temperature').clear().type(aiConfig.temperature);
    cy.get('#ai-max-tokens').clear().type(aiConfig.maxTokens);
    cy.get('#ai-timeout').clear().type(aiConfig.timeout);
    cy.get('#ai-system-prompt').clear().type(aiConfig.systemPrompt);
    cy.get('#ai-rag-corpus-id').clear().type(aiConfig.ragCorpusId);
    cy.get('#ai-rag-location').clear().type(aiConfig.ragLocation);

    cy.intercept('POST', '**/saveConfigAiApi').as('saveConfigAi');
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.wait('@saveConfigAi');

    cy.reload();
    cy.wait('@getConfigAi');

    cy.get('#ai-provider').should('have.value', aiConfig.provider);
    cy.get('#ai-api-key').should('have.value', aiConfig.apiKey);
    cy.get('#ai-model').should('have.value', aiConfig.model);
    cy.get('#ai-temperature').should('have.value', aiConfig.temperature);
    cy.get('#ai-max-tokens').should('have.value', aiConfig.maxTokens);
    cy.get('#ai-timeout').should('have.value', aiConfig.timeout);
    cy.get('#ai-system-prompt').should('have.value', aiConfig.systemPrompt);
    cy.get('#ai-rag-corpus-id').should('have.value', aiConfig.ragCorpusId);
    cy.get('#ai-rag-location').should('have.value', aiConfig.ragLocation);
  });

  it('dovrebbe salvare la configurazione SMTP', () => {
    login();

    cy.intercept('POST', '**/getConfigSmtpApi').as('getConfigSmtp');
    cy.visit('/settings-smtp', { failOnStatusCode: false });
    cy.wait('@getConfigSmtp');

    const smtpConfig = {
      host: 'smtp.test.local',
      port: '587',
      user: 'user@test.local',
      password: 'secret123',
      from: 'noreply@test.local',
      fromName: 'Test SMTP'
    };

    cy.get('#smtp-host').clear().type(smtpConfig.host);
    cy.get('#smtp-port').clear().type(smtpConfig.port);
    cy.get('#smtp-user').clear().type(smtpConfig.user);
    cy.get('#smtp-password').clear().type(smtpConfig.password);
    cy.get('#smtp-from').clear().type(smtpConfig.from);
    cy.get('#smtp-from-name').clear().type(smtpConfig.fromName);
    cy.get('#smtp-secure').check({ force: true });

    cy.intercept('POST', '**/saveConfigSmtpApi').as('saveConfigSmtp');
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.wait('@saveConfigSmtp');

    cy.reload();
    cy.wait('@getConfigSmtp');

    cy.get('#smtp-host').should('have.value', smtpConfig.host);
    cy.get('#smtp-port').should('have.value', smtpConfig.port);
    cy.get('#smtp-user').should('have.value', smtpConfig.user);
    cy.get('#smtp-password').should('have.value', smtpConfig.password);
    cy.get('#smtp-from').should('have.value', smtpConfig.from);
    cy.get('#smtp-from-name').should('have.value', smtpConfig.fromName);
    cy.get('#smtp-secure').should('be.checked');
  });
});
