import { describe, it, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';
import { COLLECTIONS } from '../../shared/constants/collections.js';
import { clearAllEmulatorData } from '../helpers/cleanup.js';
import { seedUserProfile } from '../helpers/userProfile.js';

const { USERS, CONFIG } = COLLECTIONS;

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
if (!TEST_PROJECT_ID) {
  throw new Error('Missing env var: TEST_PROJECT_ID or FIREBASE_PROJECT_ID');
}
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
        ({ getConfigAiApi, saveConfigAiApi } = await import('../../functions/api/settings-ai.js'));
        ({ getConfigSmtpApi, saveConfigSmtpApi } = await import('../../functions/api/settings-smtp.js'));
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
        await clearAllEmulatorData({ db });
    });

    afterEach(async () => {
        await test.cleanup();
        await clearAllEmulatorData({ db });
    });

    it('dovrebbe restituire configurazione AI assente', async () => {
        const wrapped = test.wrap(getConfigAiApi);
        const adminUser = { uid: 'admin-ai', token: { email: 'admin-ai@test.com' } };

        await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

        const result = await wrapped({ data: {}, auth: adminUser });

        expect(result.exists).to.equal(false);
        expect(result.data).to.equal(null);
    });

    it('dovrebbe negare getConfigAiApi senza autenticazione', async () => {
        const wrapped = test.wrap(getConfigAiApi);

        try {
            await wrapped({ data: {} });
            expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
        } catch (error) {
            expect(error.code).to.equal('unauthenticated');
        }
    });

    it('dovrebbe negare getConfigAiApi a un utente non admin', async () => {
        const wrapped = test.wrap(getConfigAiApi);
        const operatorUser = { uid: 'operatore-ai', token: { email: 'operatore-ai@test.com' } };

        await seedUserProfile(db, { uid: operatorUser.uid, email: operatorUser.token.email, role: 'operatore' });

        try {
            await wrapped({ data: {}, auth: operatorUser });
            expect.fail('La funzione non ha lanciato un errore per utente non admin');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe negare il salvataggio AI a un admin', async () => {
        const wrapped = test.wrap(saveConfigAiApi);
        const adminUser = { uid: 'admin-ai-save', token: { email: 'admin-ai-save@test.com' } };

        await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

        try {
            await wrapped({ data: { data: { provider: 'google', apiKey: 'x', model: 'm' } }, auth: adminUser });
            expect.fail('La funzione non ha lanciato un errore per admin non superuser');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe negare saveConfigAiApi senza autenticazione', async () => {
        const wrapped = test.wrap(saveConfigAiApi);

        try {
            await wrapped({ data: { data: { provider: 'google', apiKey: 'k', model: 'm' } } });
            expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
        } catch (error) {
            expect(error.code).to.equal('unauthenticated');
        }
    });

    it('dovrebbe negare saveConfigAiApi a un utente non superuser', async () => {
        const wrapped = test.wrap(saveConfigAiApi);
        const operatorUser = { uid: 'operatore-ai-save', token: { email: 'operatore-ai-save@test.com' } };

        await seedUserProfile(db, { uid: operatorUser.uid, email: operatorUser.token.email, role: 'operatore' });

        try {
            await wrapped({ data: { data: { provider: 'google', apiKey: 'k', model: 'm' } }, auth: operatorUser });
            expect.fail('La funzione non ha lanciato un errore per utente non superuser');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe validare i campi obbligatori della configurazione AI', async () => {
        const wrapped = test.wrap(saveConfigAiApi);
        const superUser = { uid: 'super-ai', token: { email: 'super-ai@test.com' } };

        await seedUserProfile(db, { uid: superUser.uid, email: superUser.token.email, role: 'superuser' });

        try {
            await wrapped({ data: { data: { provider: 'google' } }, auth: superUser });
            expect.fail('La funzione non ha validato i campi obbligatori');
        } catch (error) {
            expect(error.code).to.equal('invalid-argument');
        }
    });

    it('dovrebbe salvare configurazione AI con default quando campi opzionali mancano', async () => {
        const wrapped = test.wrap(saveConfigAiApi);
        const superUser = { uid: 'super-ai-defaults', token: { email: 'super-ai-defaults@test.com' } };

        await seedUserProfile(db, { uid: superUser.uid, email: superUser.token.email, role: 'superuser' });

        const result = await wrapped({
            data: { data: { provider: 'google', apiKey: 'key', model: 'gemini-1.5-pro' } },
            auth: superUser
        });

        expect(result.success).to.equal(true);

        const doc = await db.collection(CONFIG).doc('ai').get();
        expect(doc.exists).to.equal(true);
        expect(doc.data().temperature).to.equal(0.7);
        expect(doc.data().maxTokens).to.equal(2048);
        expect(doc.data().timeout).to.equal(30);
        expect(doc.data().enableContext).to.equal(true);
        expect(doc.data().enableSafety).to.equal(true);
    });

    it('dovrebbe salvare configurazione AI con superuser', async () => {
        const wrapped = test.wrap(saveConfigAiApi);
        const superUser = { uid: 'super-ai-save', token: { email: 'super-ai-save@test.com' } };

        await seedUserProfile(db, { uid: superUser.uid, email: superUser.token.email, role: 'superuser' });

        const result = await wrapped({
            data: { data: { provider: 'google', apiKey: 'key', model: 'gemini-1.5-pro' } },
            auth: superUser
        });

        expect(result.success).to.equal(true);

        const doc = await db.collection(CONFIG).doc('ai').get();
        expect(doc.exists).to.equal(true);
        expect(doc.data().provider).to.equal('google');
        expect(doc.data().updatedBy).to.equal(superUser.uid);
    });

    it('dovrebbe restituire configurazione AI esistente', async () => {
        const wrapped = test.wrap(getConfigAiApi);
        const adminUser = { uid: 'admin-ai-existing', token: { email: 'admin-ai-existing@test.com' } };

        await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });
        await db.collection(CONFIG).doc('ai').set({ provider: 'google', apiKey: 'k', model: 'm' });

        const result = await wrapped({ data: {}, auth: adminUser });

        expect(result.exists).to.equal(true);
        expect(result.data.provider).to.equal('google');
    });

    it('dovrebbe restituire configurazione SMTP assente', async () => {
        const wrapped = test.wrap(getConfigSmtpApi);
        const adminUser = { uid: 'admin-smtp', token: { email: 'admin-smtp@test.com' } };

        await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

        const result = await wrapped({ data: {}, auth: adminUser });

        expect(result.exists).to.equal(false);
        expect(result.data).to.equal(null);
    });

    it('dovrebbe negare getConfigSmtpApi senza autenticazione', async () => {
        const wrapped = test.wrap(getConfigSmtpApi);

        try {
            await wrapped({ data: {} });
            expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
        } catch (error) {
            expect(error.code).to.equal('unauthenticated');
        }
    });

    it('dovrebbe negare getConfigSmtpApi a un utente non admin', async () => {
        const wrapped = test.wrap(getConfigSmtpApi);
        const operatorUser = { uid: 'operatore-smtp', token: { email: 'operatore-smtp@test.com' } };

        await seedUserProfile(db, { uid: operatorUser.uid, email: operatorUser.token.email, role: 'operatore' });

        try {
            await wrapped({ data: {}, auth: operatorUser });
            expect.fail('La funzione non ha lanciato un errore per utente non admin');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe negare il salvataggio SMTP a un admin', async () => {
        const wrapped = test.wrap(saveConfigSmtpApi);
        const adminUser = { uid: 'admin-smtp-save', token: { email: 'admin-smtp-save@test.com' } };

        await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

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

    it('dovrebbe negare saveConfigSmtpApi senza autenticazione', async () => {
        const wrapped = test.wrap(saveConfigSmtpApi);

        try {
            await wrapped({
                data: { data: { host: 'smtp.test', port: 25, user: 'u', password: 'p', from: 'a', fromName: 'b' } }
            });
            expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
        } catch (error) {
            expect(error.code).to.equal('unauthenticated');
        }
    });

    it('dovrebbe negare saveConfigSmtpApi a un utente non superuser', async () => {
        const wrapped = test.wrap(saveConfigSmtpApi);
        const operatorUser = { uid: 'operatore-smtp-save', token: { email: 'operatore-smtp-save@test.com' } };

        await seedUserProfile(db, { uid: operatorUser.uid, email: operatorUser.token.email, role: 'operatore' });

        try {
            await wrapped({
                data: { data: { host: 'smtp.test', port: 25, user: 'u', password: 'p', from: 'a', fromName: 'b' } },
                auth: operatorUser
            });
            expect.fail('La funzione non ha lanciato un errore per utente non superuser');
        } catch (error) {
            expect(error.code).to.equal('permission-denied');
        }
    });

    it('dovrebbe validare i campi obbligatori della configurazione SMTP', async () => {
        const wrapped = test.wrap(saveConfigSmtpApi);
        const superUser = { uid: 'super-smtp-validate', token: { email: 'super-smtp-validate@test.com' } };

        await seedUserProfile(db, { uid: superUser.uid, email: superUser.token.email, role: 'superuser' });

        try {
            await wrapped({ data: { data: { host: 'smtp.test' } }, auth: superUser });
            expect.fail('La funzione non ha validato i campi obbligatori');
        } catch (error) {
            expect(error.code).to.equal('invalid-argument');
        }
    });

    it('dovrebbe salvare configurazione SMTP con default per secure', async () => {
        const wrapped = test.wrap(saveConfigSmtpApi);
        const superUser = { uid: 'super-smtp-default', token: { email: 'super-smtp-default@test.com' } };

        await seedUserProfile(db, { uid: superUser.uid, email: superUser.token.email, role: 'superuser' });

        const result = await wrapped({
            data: {
                data: {
                    host: 'smtp.test',
                    port: 587,
                    user: 'user',
                    password: 'pass',
                    from: 'from@test.com',
                    fromName: 'From Test'
                }
            },
            auth: superUser
        });

        expect(result.success).to.equal(true);

        const doc = await db.collection(CONFIG).doc('smtp').get();
        expect(doc.exists).to.equal(true);
        expect(doc.data().secure).to.equal(false);
    });

    it('dovrebbe salvare configurazione SMTP con superuser', async () => {
        const wrapped = test.wrap(saveConfigSmtpApi);
        const superUser = { uid: 'super-smtp-save', token: { email: 'super-smtp-save@test.com' } };

        await seedUserProfile(db, { uid: superUser.uid, email: superUser.token.email, role: 'superuser' });

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

        const doc = await db.collection(CONFIG).doc('smtp').get();
        expect(doc.exists).to.equal(true);
        expect(doc.data().host).to.equal('smtp.test');
        expect(doc.data().updatedBy).to.equal(superUser.uid);
    });

    it('dovrebbe restituire configurazione SMTP esistente', async () => {
        const wrapped = test.wrap(getConfigSmtpApi);
        const adminUser = { uid: 'admin-smtp-existing', token: { email: 'admin-smtp-existing@test.com' } };

        await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });
        await db.collection(CONFIG).doc('smtp').set({ host: 'smtp.test', port: 25, user: 'u', password: 'p', from: 'a', fromName: 'b' });

        const result = await wrapped({ data: {}, auth: adminUser });

        expect(result.exists).to.equal(true);
        expect(result.data.host).to.equal('smtp.test');
    });
});
