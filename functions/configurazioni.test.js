import { describe, it, beforeAll, afterEach, afterAll, jest } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'base-app-12108';
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

const test = fft({ projectId: TEST_PROJECT_ID });

let getConfigAiApi;
let saveConfigAiApi;
let getConfigSmtpApi;
let saveConfigSmtpApi;

describe('API Configurazioni', () => {
    // Timeout più ampio per gli hook che usano gli emulatori.
    jest.setTimeout(30000);

    let db;

    beforeAll(async () => {
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }
        admin.initializeApp({ projectId: TEST_PROJECT_ID });
        db = admin.firestore();
        ({ getConfigAiApi, saveConfigAiApi } = await import('./api/config-ai.js'));
        ({ getConfigSmtpApi, saveConfigSmtpApi } = await import('./api/config-smtp.js'));
    });

    afterAll(async () => {
        await test.cleanup();
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }
    });

    afterEach(async () => {
        await test.cleanup();

        const utentiSnap = await db.collection('utenti').get();
        const configSnap = await db.collection('configurazioni').get();
        const deletePromises = [];
        utentiSnap.forEach(doc => deletePromises.push(doc.ref.delete()));
        configSnap.forEach(doc => deletePromises.push(doc.ref.delete()));
        await Promise.all(deletePromises);
    });

    it('dovrebbe restituire configurazione AI assente', async () => {
        const wrapped = test.wrap(getConfigAiApi);
        const adminUser = { uid: 'admin-ai', token: { email: 'admin-ai@test.com' } };

        await db.collection('utenti').doc(adminUser.uid).set({ ruolo: ['admin'] });

        const result = await wrapped({ data: {}, auth: adminUser });

        expect(result.exists).to.equal(false);
        expect(result.data).to.equal(null);
    });

    it('dovrebbe negare il salvataggio AI a un admin', async () => {
        const wrapped = test.wrap(saveConfigAiApi);
        const adminUser = { uid: 'admin-ai-save', token: { email: 'admin-ai-save@test.com' } };

        await db.collection('utenti').doc(adminUser.uid).set({ ruolo: ['admin'] });

        try {
            await wrapped({ data: { data: { provider: 'google', apiKey: 'x', model: 'm' } }, auth: adminUser });
            expect.fail('La funzione non ha lanciato un errore per admin non superuser');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe validare i campi obbligatori della configurazione AI', async () => {
        const wrapped = test.wrap(saveConfigAiApi);
        const superUser = { uid: 'super-ai', token: { email: 'super-ai@test.com' } };

        await db.collection('utenti').doc(superUser.uid).set({ ruolo: ['superuser'] });

        try {
            await wrapped({ data: { data: { provider: 'google' } }, auth: superUser });
            expect.fail('La funzione non ha validato i campi obbligatori');
        } catch (error) {
            expect(error.code).to.equal('invalid-argument');
        }
    });

    it('dovrebbe salvare configurazione AI con superuser', async () => {
        const wrapped = test.wrap(saveConfigAiApi);
        const superUser = { uid: 'super-ai-save', token: { email: 'super-ai-save@test.com' } };

        await db.collection('utenti').doc(superUser.uid).set({ ruolo: ['superuser'] });

        const result = await wrapped({
            data: { data: { provider: 'google', apiKey: 'key', model: 'gemini-1.5-pro' } },
            auth: superUser
        });

        expect(result.success).to.equal(true);

        const doc = await db.collection('configurazioni').doc('ai').get();
        expect(doc.exists).to.equal(true);
        expect(doc.data().provider).to.equal('google');
        expect(doc.data().updatedBy).to.equal(superUser.uid);
    });

    it('dovrebbe restituire configurazione SMTP assente', async () => {
        const wrapped = test.wrap(getConfigSmtpApi);
        const adminUser = { uid: 'admin-smtp', token: { email: 'admin-smtp@test.com' } };

        await db.collection('utenti').doc(adminUser.uid).set({ ruolo: ['admin'] });

        const result = await wrapped({ data: {}, auth: adminUser });

        expect(result.exists).to.equal(false);
        expect(result.data).to.equal(null);
    });

    it('dovrebbe negare il salvataggio SMTP a un admin', async () => {
        const wrapped = test.wrap(saveConfigSmtpApi);
        const adminUser = { uid: 'admin-smtp-save', token: { email: 'admin-smtp-save@test.com' } };

        await db.collection('utenti').doc(adminUser.uid).set({ ruolo: ['admin'] });

        try {
            await wrapped({
                data: { data: { host: 'smtp.test', port: 25, user: 'u', password: 'p', from: 'a', fromName: 'b' } },
                auth: adminUser
            });
            expect.fail('La funzione non ha lanciato un errore per admin non superuser');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe salvare configurazione SMTP con superuser', async () => {
        const wrapped = test.wrap(saveConfigSmtpApi);
        const superUser = { uid: 'super-smtp-save', token: { email: 'super-smtp-save@test.com' } };

        await db.collection('utenti').doc(superUser.uid).set({ ruolo: ['superuser'] });

        const result = await wrapped({
            data: {
                data: {
                    host: 'smtp.test',
                    port: 587,
                    user: 'user',
                    password: 'pass',
                    from: 'from@test.com',
                    fromName: 'From Test',
                    secure: false
                }
            },
            auth: superUser
        });

        expect(result.success).to.equal(true);

        const doc = await db.collection('configurazioni').doc('smtp').get();
        expect(doc.exists).to.equal(true);
        expect(doc.data().host).to.equal('smtp.test');
        expect(doc.data().updatedBy).to.equal(superUser.uid);
    });
});
