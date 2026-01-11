describe('Profile', () => {
  const projectId = Cypress.env('FIREBASE_PROJECT_ID') || 'base-app-12108';
  const firestoreEmulatorUrl = 'http://localhost:8080';

  function setUserProfile(uid, role, idToken, profile) {
    const now = new Date().toISOString();
    return cy.request({
      method: 'POST',
      url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${uid}`,
      headers: {
        Authorization: `Bearer ${idToken}`
      },
      body: {
        fields: {
          email: { stringValue: profile.email },
          nome: { stringValue: profile.nome },
          cognome: { stringValue: profile.cognome },
          telefono: { stringValue: profile.telefono },
          status: { booleanValue: true },
          created: { stringValue: now },
          changed: { stringValue: now },
          lastModifiedBy: { stringValue: uid },
          lastModifiedByEmail: { stringValue: profile.email },
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

  function deleteAllUsers() {
    // Elimina tutti i documenti dalla collection users
    return cy.request({
      method: 'DELETE',
      url: `${firestoreEmulatorUrl}/emulator/v1/projects/${projectId}/databases/(default)/documents/users`,
      failOnStatusCode: false
    });
  }

  function getUserFromFirestore(uid, idToken) {
    return cy.request({
      method: 'GET',
      url: `${firestoreEmulatorUrl}/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      headers: idToken ? {
        Authorization: `Bearer ${idToken}`
      } : {},
      failOnStatusCode: false
    });
  }

  it('dovrebbe creare il primo utente come SUPERUSER completando il profilo', () => {
    const email = `superuser.${Date.now()}@test.local`;
    const password = 'SuperPass123!';
    const profile = {
      nome: 'Super',
      cognome: 'Admin',
      telefono: '+39 333 9999999'
    };
    let uid;
    let idToken;

    // 1. Elimina tutti gli utenti dalla collection Firestore per garantire collection vuota
    deleteAllUsers();

    // 2. Crea solo l'utente in Auth (senza profilo Firestore)
    cy.createAuthUser(email, password).then((result) => {
      uid = result.uid;
      idToken = result.idToken;
    });

    // 3. Login con email e password usando il form standard
    cy.login(email, password);

    // 4. Visita la pagina profilo
    cy.visit('/profile', { failOnStatusCode: false });

    // 5. Aspetta che il form sia completamente caricato e l'email sia popolata
    cy.get('#profile-email').should('have.value', email);

    // 6. Compila il form con i dati del profilo
    // Usa invoke('val', value) per impostare direttamente il valore
    cy.get('#profile-nome').invoke('val', profile.nome);
    cy.get('#profile-cognome').invoke('val', profile.cognome);
    cy.get('#profile-telefono').invoke('val', profile.telefono);

    // 7. Salva il profilo (chiama userSelfUpdateApi che crea SUPERUSER)
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });

    // 8. Verifica se c'è un errore o successo
    cy.get('body').then(($body) => {
      if ($body.find('#profile-error-message:visible').length > 0) {
        // C'è un errore, loggalo e fai fallire il test
        cy.get('#profile-error-message').invoke('text').then((errorText) => {
          throw new Error(`Errore durante il salvataggio: ${errorText}`);
        });
      }
    });

    cy.get('#profile-save-message', { timeout: 15000 }).should('be.visible');

    // 9. Verifica che i campi nel form siano aggiornati
    cy.get('#profile-nome').should('have.value', profile.nome);
    cy.get('#profile-cognome').should('have.value', profile.cognome);
    cy.get('#profile-email').should('have.value', email);
    cy.get('#profile-telefono').should('have.value', profile.telefono);
    cy.get('#profile-ruolo').should('have.value', 'Super User');

    // 10. Verifica che l'utente sia stato creato in Firestore con ruolo SUPERUSER
    cy.then(() => {
      getUserFromFirestore(uid, idToken).then((response) => {
        expect(response.status).to.eq(200);
        const userData = response.body.fields;

        // Verifica i campi essenziali
        expect(userData.nome.stringValue).to.eq(profile.nome);
        expect(userData.cognome.stringValue).to.eq(profile.cognome);
        expect(userData.telefono.stringValue).to.eq(profile.telefono);
        expect(userData.ruolo.arrayValue.values[0].stringValue).to.eq('superuser');
        expect(userData.status.booleanValue).to.eq(true);

        // L'email dovrebbe essere presente
        expect(userData.email).to.exist;
        expect(userData.email.stringValue).to.eq(email);
      });
    });
  });

  it('dovrebbe caricare i dati profilo da Firestore', () => {
    const email = `admin.profile.${Date.now()}@test.local`;
    const password = 'AdminPass123!';
    const profile = {
      email,
      nome: 'Mario',
      cognome: 'Rossi',
      telefono: '+39 333 0000000'
    };

    // Crea utente in Auth E Firestore con ruolo admin
    cy.createAuthUser(email, password)
      .then(({ uid, idToken }) => setUserProfile(uid, 'admin', idToken, profile));

    // Login e visita profilo
    cy.login(email, password);
    cy.visit('/profile', { failOnStatusCode: false });

    // Attendi che il form sia completamente caricato
    cy.get('#profile-email').should('have.value', profile.email);

    // Verifica che i dati siano caricati correttamente
    cy.get('#profile-nome').should('have.value', profile.nome);
    cy.get('#profile-cognome').should('have.value', profile.cognome);
    cy.get('#profile-telefono').should('have.value', profile.telefono);
    cy.get('#profile-ruolo').should('have.value', 'Amministratore');
  });

  it('dovrebbe aggiornare i dati profilo', () => {
    const email = `admin.profile.update.${Date.now()}@test.local`;
    const password = 'AdminPass123!';
    const profile = {
      email,
      nome: 'Anna',
      cognome: 'Verdi',
      telefono: '+39 333 1111111'
    };

    // Crea utente in Auth E Firestore con ruolo admin
    cy.createAuthUser(email, password)
      .then(({ uid, idToken }) => setUserProfile(uid, 'admin', idToken, profile));

    // Login e visita profilo
    cy.login(email, password);
    cy.visit('/profile', { failOnStatusCode: false });

    // Attendi che il form sia completamente caricato con i dati originali
    cy.get('#profile-email').should('have.value', profile.email);
    cy.get('#profile-nome').should('have.value', profile.nome);
    cy.get('#profile-cognome').should('have.value', profile.cognome);
    cy.get('#profile-telefono').should('have.value', profile.telefono);

    // Modifica i campi usando invoke per evitare race conditions
    cy.get('#profile-nome').invoke('val', 'Luca');
    cy.get('#profile-cognome').invoke('val', 'Bianchi');
    cy.get('#profile-telefono').invoke('val', '+39 333 2222222');

    // Salva
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.get('#profile-save-message', { timeout: 10000 }).should('be.visible');

    // Verifica che i campi siano aggiornati con i nuovi valori
    cy.get('#profile-nome').should('have.value', 'Luca');
    cy.get('#profile-cognome').should('have.value', 'Bianchi');
    cy.get('#profile-telefono').should('have.value', '+39 333 2222222');
  });

  it('dovrebbe aggiornare l\'avatar quando cambia il nome profilo', () => {
    const email = `avatar.profile.${Date.now()}@test.local`;
    const password = 'AdminPass123!';
    const profile = {
      email,
      nome: 'Marco',
      cognome: 'Neri',
      telefono: '+39 333 5555555'
    };

    cy.createAuthUser(email, password)
      .then(({ uid, idToken }) => setUserProfile(uid, 'admin', idToken, profile));

    cy.login(email, password);
    cy.visit('/profile', { failOnStatusCode: false });

    cy.get('#profile-email').should('have.value', profile.email);

    // Cambia il nome e salva
    cy.get('#profile-nome').invoke('val', 'Luigi');
    cy.get('button[type="submit"]').scrollIntoView().click({ force: true });
    cy.get('#profile-save-message', { timeout: 10000 }).should('be.visible');

    // L'avatar deve aggiornarsi con il nuovo nome
    const expected = encodeURIComponent('Luigi');
    cy.get('#avatar-icon', { timeout: 10000 })
      .should('have.attr', 'src')
      .and('include', `name=${expected}`);
  });
});
