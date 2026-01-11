/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    createAuthUser(email: string, password: string): Chainable<{ uid: string; idToken: string }>;
    setUserRole(uid: string, role: string, idToken: string, email: string): Chainable;
    setCustomClaims(uid: string, claims: Record<string, unknown>): Chainable;
    seedUser(email: string, password: string, role: string): Chainable<{ uid: string; idToken: string; email: string; role: string }>;
    seedAuthOnlyUser(email: string, password: string, role: string): Chainable<{ uid: string; idToken: string; email: string; role: string }>;
    seedAdmin(email: string, password: string): Chainable<{ uid: string; idToken: string; email: string; role: string }>;
    seedAuthOnlyAdmin(email: string, password: string): Chainable<{ uid: string; idToken: string; email: string; role: string }>;
    seedOperatore(email: string, password: string): Chainable<{ uid: string; idToken: string; email: string; role: string }>;
    seedSuperuser(email: string, password: string): Chainable<{ uid: string; idToken: string; email: string; role: string }>;
    clearAllUsers(): Chainable<void>;
    clearAllAuthUsers(): Chainable<void>;
    clearCollection(collection: string): Chainable<void>;
    clearAllClienti(): Chainable<void>;
    login(email: string, password: string): Chainable<void>;
    searchDataTable(text: string): Chainable<void>;
    findDataTableRow(text: string, options?: { timeout?: number }): Chainable<JQuery<HTMLElement>>;
    waitForTableSync(text: string, options?: { timeout?: number; exists?: boolean }): Chainable<void>;
    typeInto(selector: string, value: string): Chainable<void>;
  }
}
