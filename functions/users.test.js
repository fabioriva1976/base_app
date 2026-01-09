import { describe, it, beforeAll, afterEach } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'base-app-12108-test';
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const test = fft({ projectId: TEST_PROJECT_ID });

let userListApi;
let userCreateApi;
let userUpdateApi;
let userDeleteApi;

describe('API Utenti', () => {
    let db;
    let auth;

    beforeAll(async () => {
        if (admin.apps.length === 0) {
            admin.initializeApp({ projectId: TEST_PROJECT_ID });
        }
        db = admin.firestore();
        auth = admin.auth();
        ({ userListApi, userCreateApi, userUpdateApi, userDeleteApi } = await import('./api/users.js'));
    });

    afterEach(async () => {
        await test.cleanup();

        const utentiSnap = await db.collection('utenti').get();
        const deletePromises = [];
        utentiSnap.forEach(doc => deletePromises.push(doc.ref.delete()));
        await Promise.all(deletePromises);

        const auditSnap = await db.collection('audit_logs').get();
        const auditDeletes = [];
        auditSnap.forEach(doc => auditDeletes.push(doc.ref.delete()));
        await Promise.all(auditDeletes);

        const userRecords = await auth.listUsers(1000);
        await Promise.all(userRecords.users.map(user => auth.deleteUser(user.uid)));
    });

    it('dovrebbe negare userListApi senza autenticazione', async () => {
        const wrapped = test.wrap(userListApi);

        try {
            await wrapped({ data: {} });
            expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
        } catch (error) {
            expect(error.code).to.equal('unauthenticated');
        }
    });

    it('dovrebbe permettere a un admin di listare gli utenti', async () => {
        const wrapped = test.wrap(userListApi);
        const adminUser = { uid: 'admin-list', token: { email: 'admin-list@test.com' } };

        await db.collection('utenti').doc(adminUser.uid).set({ ruolo: ['admin'] });
        await auth.createUser({ uid: 'user-1', email: 'user1@test.com', password: 'password1' });

        const result = await wrapped({ data: {}, auth: adminUser });

        expect(result.users).to.be.an('array');
        expect(result.users.some(user => user.email === 'user1@test.com')).to.equal(true);
    });

    it('dovrebbe permettere a un admin di creare un operatore', async () => {
        const wrapped = test.wrap(userCreateApi);
        const adminUser = { uid: 'admin-create', token: { email: 'admin-create@test.com' } };
        const payload = {
            email: 'new-operatore@test.com',
            password: 'password123',
            displayName: 'Operatore Test',
            ruolo: 'operatore'
        };

        await db.collection('utenti').doc(adminUser.uid).set({ ruolo: ['admin'] });

        const result = await wrapped({ data: payload, auth: adminUser });

        expect(result.uid).to.be.a('string');
        expect(result.wasExisting).to.equal(false);

        const created = await auth.getUserByEmail(payload.email);
        expect(created.displayName).to.equal(payload.displayName);

        const auditSnap = await db.collection('audit_logs')
            .where('entityType', '==', 'utenti')
            .where('entityId', '==', result.uid)
            .where('action', '==', 'create')
            .limit(1)
            .get();

        expect(auditSnap.empty).to.equal(false);
    });

    it('dovrebbe permettere a un admin di aggiornare un operatore', async () => {
        const wrapped = test.wrap(userUpdateApi);
        const adminUser = { uid: 'admin-update', token: { email: 'admin-update@test.com' } };

        await db.collection('utenti').doc(adminUser.uid).set({ ruolo: ['admin'] });

        const target = await auth.createUser({
            uid: 'operatore-update',
            email: 'operatore-update@test.com',
            password: 'password123',
            displayName: 'Operatore Old'
        });
        await db.collection('utenti').doc(target.uid).set({ ruolo: ['operatore'] });

        const result = await wrapped({
            data: { uid: target.uid, displayName: 'Operatore New' },
            auth: adminUser
        });

        expect(result.message).to.equal('Utente aggiornato con successo!');

        const updated = await auth.getUser(target.uid);
        expect(updated.displayName).to.equal('Operatore New');
    });

    it('dovrebbe permettere a un admin di eliminare un operatore', async () => {
        const wrapped = test.wrap(userDeleteApi);
        const adminUser = { uid: 'admin-delete', token: { email: 'admin-delete@test.com' } };

        await db.collection('utenti').doc(adminUser.uid).set({ ruolo: ['admin'] });
        // Assicurati che il documento admin sia stato scritto
        const adminDoc = await db.collection('utenti').doc(adminUser.uid).get();
        expect(adminDoc.exists).to.equal(true);

        const target = await auth.createUser({
            uid: 'operatore-delete',
            email: 'operatore-delete@test.com',
            password: 'password123'
        });
        await db.collection('utenti').doc(target.uid).set({ ruolo: ['operatore'] });

        const result = await wrapped({ data: { uid: target.uid }, auth: adminUser });

        expect(result.wasInAuth).to.equal(true);

        try {
            await auth.getUser(target.uid);
            expect.fail('Utente non eliminato da Auth');
        } catch (error) {
            expect(error.code).to.equal('auth/user-not-found');
        }
    });
});
