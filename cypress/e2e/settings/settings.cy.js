describe('Settings - AI e SMTP', () => {

  const credentials = {
    email: `superuser.${Date.now()}@test.local`,
    password: 'SuperPass123!'
  };

  before(() => {
    cy.seedSuperuser(credentials.email, credentials.password);
  });

  function login() {
    cy.login(credentials.email, credentials.password);
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
    cy.typeInto('#ai-api-key', aiConfig.apiKey);
    cy.get('#ai-model').select(aiConfig.model);
    cy.typeInto('#ai-temperature', aiConfig.temperature);
    cy.typeInto('#ai-max-tokens', aiConfig.maxTokens);
    cy.typeInto('#ai-timeout', aiConfig.timeout);
    cy.typeInto('#ai-system-prompt', aiConfig.systemPrompt);
    cy.typeInto('#ai-rag-corpus-id', aiConfig.ragCorpusId);
    cy.typeInto('#ai-rag-location', aiConfig.ragLocation);

    cy.intercept('POST', '**/saveConfigAiApi').as('saveConfigAi');
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.wait('@saveConfigAi');

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

    cy.typeInto('#smtp-host', smtpConfig.host);
    cy.typeInto('#smtp-port', smtpConfig.port);
    cy.typeInto('#smtp-user', smtpConfig.user);
    cy.typeInto('#smtp-password', smtpConfig.password);
    cy.typeInto('#smtp-from', smtpConfig.from);
    cy.typeInto('#smtp-from-name', smtpConfig.fromName);
    cy.get('#smtp-secure').check({ force: true });

    cy.intercept('POST', '**/saveConfigSmtpApi').as('saveConfigSmtp');
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.wait('@saveConfigSmtp');

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
