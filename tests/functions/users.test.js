import { describe, it, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';
import { COLLECTIONS } from '../../shared/constants/collections.js';
import { seedUserProfile } from '../helpers/userProfile.js';
import { clearAllEmulatorData } from '../helpers/cleanup.js';

const { USERS, AUDIT_LOGS } = COLLECTIONS;

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'base-app-12108';
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const test = fft({ projectId: TEST_PROJECT_ID });

let userCreateApi;
let userUpdateApi;
let userDeleteApi;
let userSelfUpdateApi;

describe('API Utenti', () => {
    // Imposta un timeout più ampio per gli hook che interagiscono con gli emulatori.
    jest.setTimeout(30000);

    let db;
    let auth;

    async function seedUserRole(uid, role, email) {
        await seedUserProfile(db, { uid, role, email });
    }

    function makeAuthContext(uid, email) {
        return { uid, token: { email } };
    }

    beforeAll(async () => {
        if (admin.apps.length === 0) {
            admin.initializeApp({ projectId: TEST_PROJECT_ID });
        }
        db = admin.firestore();
        auth = admin.auth();
        ({ userCreateApi, userUpdateApi, userDeleteApi, userSelfUpdateApi } = await import('../../functions/api/users.js'));
    });

    afterAll(async () => {
        await test.cleanup();
        if (db && typeof db.terminate === 'function') {
            await db.terminate();
        }
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }
    });

    beforeEach(async () => {
        await clearAllEmulatorData({ db, auth });
    });

    afterEach(async () => {
        await test.cleanup();
        await clearAllEmulatorData({ db, auth });
    });

    it('dovrebbe negare userCreateApi a un utente non admin', async () => {
        // Verifica che solo admin possano creare users.
        const wrapped = test.wrap(userCreateApi);
        const operatorUser = makeAuthContext('operatore-create', 'operatore-create@test.com');
        const payload = {
            email: 'blocked-create@test.com',
            password: 'password123',
            displayName: 'Operatore Blocked',
            ruolo: 'operatore'
        };

        await seedUserRole(operatorUser.uid, 'operatore', operatorUser.token.email);

        try {
            await wrapped({ data: payload, auth: operatorUser });
            expect.fail('La funzione non ha lanciato un errore per utente non admin');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe permettere a un admin di creare un operatore', async () => {
        // Verifica creazione utente con ruolo gestibile.
        const wrapped = test.wrap(userCreateApi);
        const adminUser = makeAuthContext('admin-create', 'admin-create@test.com');
        const payload = {
            email: 'new-operatore@test.com',
            password: 'password123',
            displayName: 'Operatore Test',
            ruolo: 'operatore'
        };

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);

        const result = await wrapped({ data: payload, auth: adminUser });

        expect(result.uid).to.be.a('string');
        expect(result.wasExisting).to.equal(false);

        const created = await auth.getUserByEmail(payload.email);
        expect(created.displayName).to.equal(payload.displayName);

        // Verifica audit log per creazione.
        const auditSnap = await db.collection(AUDIT_LOGS)
            .where('entityType', '==', USERS)
            .where('entityId', '==', result.uid)
            .where('action', '==', 'create')
            .limit(1)
            .get();

        expect(auditSnap.empty).to.equal(false);
        const auditDoc = auditSnap.docs[0]?.data();
        expect(auditDoc?.newData?.email).to.equal(payload.email);
        expect(auditDoc?.newData?.ruolo?.[0]).to.equal('operatore');
    });

    it('dovrebbe negare ad un admin la creazione di un ruolo superiore', async () => {
        // Verifica che un admin non possa creare un admin/superuser.
        const wrapped = test.wrap(userCreateApi);
        const adminUser = makeAuthContext('admin-create-denied', 'admin-create-denied@test.com');
        const payload = {
            email: 'new-admin@test.com',
            password: 'password123',
            displayName: 'Admin Test',
            ruolo: 'admin'
        };

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);

        try {
            await wrapped({ data: payload, auth: adminUser });
            expect.fail('La funzione non ha lanciato un errore per ruolo non gestibile');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe fallire con email non valida in userCreateApi', async () => {
        // Verifica la validazione input.
        const wrapped = test.wrap(userCreateApi);
        const adminUser = makeAuthContext('admin-create-invalid', 'admin-create-invalid@test.com');

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);

        try {
            await wrapped({ data: { email: 'not-an-email', ruolo: 'operatore' }, auth: adminUser });
            expect.fail('La funzione non ha lanciato un errore per email non valida');
        } catch (error) {
            expect(error.code).to.equal('invalid-argument');
        }
    });

    it('dovrebbe sincronizzare un utente già esistente in Auth', async () => {
        // Verifica il caso di email già presente in Firebase Auth.
        const wrapped = test.wrap(userCreateApi);
        const adminUser = makeAuthContext('admin-create-existing', 'admin-create-existing@test.com');
        const payload = {
            email: 'existing@test.com',
            password: 'password123',
            displayName: 'Nome Aggiornato',
            ruolo: 'operatore'
        };

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);
        await auth.createUser({ email: payload.email, password: 'oldpassword', displayName: 'Old Name' });

        const result = await wrapped({ data: payload, auth: adminUser });
        expect(result.wasExisting).to.equal(true);

        const updated = await auth.getUserByEmail(payload.email);
        expect(updated.displayName).to.equal(payload.displayName);

        // Verifica audit log per update (sync).
        const auditSnap = await db.collection(AUDIT_LOGS)
            .where('entityType', '==', USERS)
            .where('entityId', '==', result.uid)
            .where('action', '==', 'update')
            .limit(1)
            .get();

        expect(auditSnap.empty).to.equal(false);
        const auditDoc = auditSnap.docs[0]?.data();
        expect(auditDoc?.newData?.email).to.equal(payload.email);
    });

    it('dovrebbe negare userUpdateApi a un utente non admin', async () => {
        // Verifica che solo admin possano aggiornare users.
        const wrapped = test.wrap(userUpdateApi);
        const operatorUser = makeAuthContext('operatore-update', 'operatore-update@test.com');

        await seedUserRole(operatorUser.uid, 'operatore', operatorUser.token.email);

        try {
            await wrapped({ data: { uid: 'target-id', displayName: 'Test' }, auth: operatorUser });
            expect.fail('La funzione non ha lanciato un errore per utente non admin');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe permettere a un admin di aggiornare un operatore', async () => {
        // Verifica update consentito su utente con ruolo gestibile.
        const wrapped = test.wrap(userUpdateApi);
        const adminUser = makeAuthContext('admin-update', 'admin-update@test.com');

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);

        const target = await auth.createUser({
            uid: 'operatore-update',
            email: 'operatore-update@test.com',
            password: 'password123',
            displayName: 'Operatore Old'
        });
        await seedUserProfile(db, { uid: target.uid, email: target.email, role: 'operatore' });

        const result = await wrapped({
            data: { uid: target.uid, displayName: 'Operatore New' },
            auth: adminUser
        });

        expect(result.message).to.equal('Utente aggiornato con successo!');

        const updated = await auth.getUser(target.uid);
        expect(updated.displayName).to.equal('Operatore New');

        // Verifica audit log per update.
        const auditSnap = await db.collection(AUDIT_LOGS)
            .where('entityType', '==', USERS)
            .where('entityId', '==', target.uid)
            .where('action', '==', 'update')
            .limit(1)
            .get();

        expect(auditSnap.empty).to.equal(false);
        const auditDoc = auditSnap.docs[0]?.data();
        expect(auditDoc?.newData?.lastModifiedBy).to.equal(adminUser.uid);
        expect(auditDoc?.newData?.changed).to.be.a('string');
    });

    it('dovrebbe negare ad un admin il cambio ruolo a admin/superuser', async () => {
        // Verifica che un admin non possa assegnare ruoli superiori.
        const wrapped = test.wrap(userUpdateApi);
        const adminUser = makeAuthContext('admin-update-denied', 'admin-update-denied@test.com');

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);

        const target = await auth.createUser({
            uid: 'operatore-role-change',
            email: 'operatore-role-change@test.com',
            password: 'password123'
        });
        await seedUserProfile(db, { uid: target.uid, email: target.email, role: 'operatore' });

        try {
            await wrapped({ data: { uid: target.uid, ruolo: 'admin' }, auth: adminUser });
            expect.fail('La funzione non ha lanciato un errore per cambio ruolo non consentito');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe fallire con email non valida in userUpdateApi', async () => {
        // Verifica validazione aggiornamento.
        const wrapped = test.wrap(userUpdateApi);
        const adminUser = makeAuthContext('admin-update-invalid', 'admin-update-invalid@test.com');

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);

        const target = await auth.createUser({
            uid: 'operatore-update-invalid',
            email: 'operatore-update-invalid@test.com',
            password: 'password123'
        });
        await seedUserProfile(db, { uid: target.uid, email: target.email, role: 'operatore' });

        try {
            await wrapped({ data: { uid: target.uid, email: 'not-an-email' }, auth: adminUser });
            expect.fail('La funzione non ha lanciato un errore per email non valida');
        } catch (error) {
            expect(error.code).to.equal('invalid-argument');
        }
    });

    it('dovrebbe permettere a un superuser di aggiornare anche se il target non esiste in Firestore', async () => {
        // Verifica il fallback superuser quando il profilo Firestore manca.
        const wrapped = test.wrap(userUpdateApi);
        const superUser = makeAuthContext('superuser-update', 'superuser-update@test.com');

        await seedUserRole(superUser.uid, 'superuser', superUser.token.email);

        await auth.createUser({
            uid: 'missing-profile',
            email: 'missing-profile@test.com',
            password: 'password123'
        });

        const result = await wrapped({
            data: { uid: 'missing-profile', displayName: 'Profilo Creato' },
            auth: superUser
        });

        expect(result.message).to.equal('Utente aggiornato con successo!');

        const profileSnap = await db.collection(USERS).doc('missing-profile').get();
        expect(profileSnap.exists).to.equal(true);

        // Verifica audit log per update su profilo creato.
        const auditSnap = await db.collection(AUDIT_LOGS)
            .where('entityType', '==', USERS)
            .where('entityId', '==', 'missing-profile')
            .where('action', '==', 'update')
            .limit(1)
            .get();

        expect(auditSnap.empty).to.equal(false);
        const auditDoc = auditSnap.docs[0]?.data();
        expect(auditDoc?.newData?.lastModifiedBy).to.equal(superUser.uid);
        expect(auditDoc?.newData?.changed).to.be.a('string');
    });

    it('dovrebbe negare userDeleteApi a un utente non admin', async () => {
        // Verifica che solo admin possano eliminare users.
        const wrapped = test.wrap(userDeleteApi);
        const operatorUser = makeAuthContext('operatore-delete', 'operatore-delete@test.com');

        await seedUserRole(operatorUser.uid, 'operatore', operatorUser.token.email);

        try {
            await wrapped({ data: { uid: 'target-delete' }, auth: operatorUser });
            expect.fail('La funzione non ha lanciato un errore per utente non admin');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe permettere a un admin di eliminare un operatore', async () => {
        // Verifica delete di un utente con ruolo gestibile.
        const wrapped = test.wrap(userDeleteApi);
        const adminUser = makeAuthContext('admin-delete', 'admin-delete@test.com');

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);
        // Assicurati che il documento admin sia stato scritto
        const adminDoc = await db.collection(USERS).doc(adminUser.uid).get();
        expect(adminDoc.exists).to.equal(true);

        const target = await auth.createUser({
            uid: 'operatore-delete',
            email: 'operatore-delete@test.com',
            password: 'password123'
        });
        await seedUserProfile(db, { uid: target.uid, email: target.email, role: 'operatore' });

        const result = await wrapped({ data: { uid: target.uid }, auth: adminUser });

        expect(result.wasInAuth).to.equal(true);

        try {
            await auth.getUser(target.uid);
            expect.fail('Utente non eliminato da Auth');
        } catch (error) {
            expect(error.code).to.equal('auth/user-not-found');
        }

        // Verifica audit log per delete.
        const auditSnap = await db.collection(AUDIT_LOGS)
            .where('entityType', '==', USERS)
            .where('entityId', '==', target.uid)
            .where('action', '==', 'delete')
            .limit(1)
            .get();

        expect(auditSnap.empty).to.equal(false);
        const auditDoc = auditSnap.docs[0]?.data();
        expect(auditDoc?.oldData).to.be.an('object');
    });

    it('dovrebbe negare la cancellazione del proprio account', async () => {
        // Verifica che l’utente non possa eliminare se stesso.
        const wrapped = test.wrap(userDeleteApi);
        const adminUser = makeAuthContext('admin-self-delete', 'admin-self-delete@test.com');

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);
        await auth.createUser({ uid: adminUser.uid, email: adminUser.token.email, password: 'password123' });
        await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

        try {
            await wrapped({ data: { uid: adminUser.uid }, auth: adminUser });
            expect.fail('La funzione non ha lanciato un errore per self-delete');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe fallire se il target non esiste in Firestore', async () => {
        // Verifica la gestione del not-found in Firestore.
        const wrapped = test.wrap(userDeleteApi);
        const adminUser = makeAuthContext('admin-delete-missing', 'admin-delete-missing@test.com');

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);

        try {
            await wrapped({ data: { uid: 'missing-firestore' }, auth: adminUser });
            expect.fail('La funzione non ha lanciato un errore per utente assente in Firestore');
        } catch (error) {
            expect(error.code).to.equal('not-found');
        }
    });

    it('dovrebbe eliminare un utente presente solo in Firestore', async () => {
        // Verifica delete con utente non presente in Auth.
        const wrapped = test.wrap(userDeleteApi);
        const adminUser = makeAuthContext('admin-delete-firestore-only', 'admin-delete-firestore-only@test.com');

        await seedUserRole(adminUser.uid, 'admin', adminUser.token.email);
        await seedUserProfile(db, { uid: 'firestore-only', email: 'firestore-only@test.com', role: 'operatore' });

        const result = await wrapped({ data: { uid: 'firestore-only' }, auth: adminUser });
        expect(result.wasInAuth).to.equal(false);

        const deletedSnap = await db.collection(USERS).doc('firestore-only').get();
        expect(deletedSnap.exists).to.equal(false);

        // Verifica audit log per delete su utente solo Firestore.
        const auditSnap = await db.collection(AUDIT_LOGS)
            .where('entityType', '==', USERS)
            .where('entityId', '==', 'firestore-only')
            .where('action', '==', 'delete')
            .limit(1)
            .get();

        expect(auditSnap.empty).to.equal(false);
        const auditDoc = auditSnap.docs[0]?.data();
        expect(auditDoc?.oldData).to.be.an('object');
    });

    it('dovrebbe negare userSelfUpdateApi senza autenticazione', async () => {
        const wrapped = test.wrap(userSelfUpdateApi);

        try {
            await wrapped({ data: { nome: 'Test' } });
            expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
        } catch (error) {
            expect(error.code).to.equal('unauthenticated');
        }
    });

    it('dovrebbe aggiornare solo il proprio profilo', async () => {
        const wrapped = test.wrap(userSelfUpdateApi);
        const selfUser = makeAuthContext('self-user', 'self-user@test.com');
        const otherUser = makeAuthContext('other-user', 'other-user@test.com');

        await auth.createUser({ uid: selfUser.uid, email: selfUser.token.email, password: 'password123' });
        await auth.createUser({ uid: otherUser.uid, email: otherUser.token.email, password: 'password123' });

        await seedUserProfile(db, { uid: selfUser.uid, email: selfUser.token.email, role: 'operatore' });
        await seedUserProfile(db, { uid: otherUser.uid, email: otherUser.token.email, role: 'operatore' });

        await wrapped({
            data: {
                nome: 'Giulia',
                cognome: 'Verdi',
                telefono: '+39 333 4444444',
                email: 'self-user@test.com',
                displayName: 'Giulia Verdi',
                uid: otherUser.uid
            },
            auth: selfUser
        });

        const selfDoc = await db.collection(USERS).doc(selfUser.uid).get();
        expect(selfDoc.exists).to.equal(true);
        expect(selfDoc.data().nome).to.equal('Giulia');
        expect(selfDoc.data().cognome).to.equal('Verdi');
        expect(selfDoc.data().telefono).to.equal('+39 333 4444444');

        const otherDoc = await db.collection(USERS).doc(otherUser.uid).get();
        expect(otherDoc.exists).to.equal(true);
        expect(otherDoc.data().nome || '').to.equal('');
        expect(otherDoc.data().cognome || '').to.equal('');
    });
});
