import { describe, it, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';
import { COLLECTIONS } from '../../shared/constants/collections.js';
import { clearAllEmulatorData } from '../helpers/cleanup.js';
import { seedUserProfile } from '../helpers/userProfile.js';

const { USERS, CLIENTI, AUDIT_LOGS } = COLLECTIONS;

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
if (!TEST_PROJECT_ID) {
  throw new Error('Missing env var: TEST_PROJECT_ID or FIREBASE_PROJECT_ID');
}
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Inizializza firebase-functions-test.
// Puntiamo al file di configurazione corretto per gli emulatori.
const test = fft({ projectId: TEST_PROJECT_ID });

let createClienteApi;
let updateClienteApi;
let deleteClienteApi;

describe('API Clienti', () => {
    // Timeout più ampio per gli hook che usano gli emulatori.
    jest.setTimeout(30000);

    let db;

    // Prima di tutti i test, inizializziamo l'app admin
    beforeAll(async () => {
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }
        admin.initializeApp({ projectId: TEST_PROJECT_ID });
        db = admin.firestore();
        ({ createClienteApi, updateClienteApi, deleteClienteApi } = await import('../../functions/api/clienti.js'));
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

    describe('clienteCreateApi', () => {
        it('dovrebbe negare a un operatore la creazione di un cliente', async () => {
            const wrapped = test.wrap(createClienteApi);
            const user = { uid: 'operatore-test', token: { email: 'op@test.com' } };
            const clienteData = { ragione_sociale: 'Nuovo Cliente' };

            // Crea l'utente operatore nel DB emulato
            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'operatore' });

            try {
                await wrapped({ data: clienteData, auth: user });
                expect.fail('La funzione non ha lanciato un errore per operatore');
            } catch (error) {
                expect(error.code).to.equal('permission-denied');
            }
        });

        it('dovrebbe permettere a un admin di creare un cliente', async () => {
            const wrapped = test.wrap(createClienteApi);
            const user = { uid: 'admin-test', token: { email: 'admin@test.com' } };
            const clienteData = { ragione_sociale: 'Nuovo Cliente da Admin', codice: 'CL-001', email: 'cliente@test.com' };

            // Crea l'utente admin nel DB emulato
            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

            const result = await wrapped({ data: clienteData, auth: user });

            expect(result.id).to.be.a('string');
            expect(result.ragione_sociale).to.equal('Nuovo Cliente da Admin');

            // Verifica che il cliente sia stato effettivamente scritto nel database
            const doc = await db.collection(CLIENTI).doc(result.id).get();
            expect(doc.exists).to.be.true;
            expect(doc.data().ragione_sociale).to.equal('Nuovo Cliente da Admin');

            // Verifica audit log di creazione
            const auditSnap = await db.collection(AUDIT_LOGS)
                .where('entityType', '==', CLIENTI)
                .where('entityId', '==', result.id)
                .where('action', '==', 'create')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
            const auditDoc = auditSnap.docs[0]?.data();
            expect(auditDoc?.newData?.ragione_sociale).to.equal('Nuovo Cliente da Admin');
            expect(auditDoc?.newData?.codice).to.equal('CL-001');
        });

        it('dovrebbe lanciare un errore se la ragione sociale manca', async () => {
            const wrapped = test.wrap(createClienteApi);
            const user = { uid: 'admin-test', token: { email: 'admin@test.com' } };
            const clienteData = { codice: 'CL-ERR-01', email: 'cliente@test.com' }; // Manca ragione_sociale

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

            try {
                await wrapped({ data: clienteData, auth: user });
                expect.fail('La funzione non ha validato i dati');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
                expect(error.message).to.include('La ragione sociale è obbligatoria');
            }
        });
    });

    describe('updateClienteApi', () => {
        it('dovrebbe negare a un operatore l\'aggiornamento di un cliente', async () => {
            const wrapped = test.wrap(updateClienteApi);
            const user = { uid: 'operatore-update', token: { email: 'op-update@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'operatore' });

            try {
                await wrapped({ data: { id: 'cliente-id', ragione_sociale: 'Aggiornato' }, auth: user });
                expect.fail('La funzione non ha lanciato un errore per operatore');
            } catch (error) {
                expect(error.code).to.equal('permission-denied');
            }
        });

        it('dovrebbe validare la presenza dell\'ID cliente', async () => {
            const wrapped = test.wrap(updateClienteApi);
            const user = { uid: 'admin-update-missing', token: { email: 'admin-update-missing@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

            try {
                await wrapped({ data: { ragione_sociale: 'Aggiornato' }, auth: user });
                expect.fail('La funzione non ha validato l\'ID');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe validare i dati aggiornati', async () => {
            const wrapped = test.wrap(updateClienteApi);
            const user = { uid: 'admin-update-invalid', token: { email: 'admin-update-invalid@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

            const docRef = await db.collection(CLIENTI).add({ ragione_sociale: 'Cliente Old', codice: 'CL-OLD-01' });

            try {
                await wrapped({
                    data: { id: docRef.id, ragione_sociale: 'Cliente New', codice: 'CL-NEW-01', email: 'not-an-email' },
                    auth: user
                });
                expect.fail('La funzione non ha validato l\'email');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe permettere a un admin di aggiornare un cliente', async () => {
            const wrapped = test.wrap(updateClienteApi);
            const user = { uid: 'admin-update', token: { email: 'admin-update@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

            const docRef = await db.collection(CLIENTI).add({ ragione_sociale: 'Cliente Old', codice: 'CL-OLD-02' });

            const result = await wrapped({
                data: { id: docRef.id, ragione_sociale: 'Cliente New', codice: 'CL-NEW-02', email: 'cliente@update.com' },
                auth: user
            });

            expect(result.message).to.equal('Cliente aggiornato con successo.');

            const updatedDoc = await db.collection(CLIENTI).doc(docRef.id).get();
            expect(updatedDoc.data().ragione_sociale).to.equal('Cliente New');

            const auditSnap = await db.collection(AUDIT_LOGS)
                .where('entityType', '==', CLIENTI)
                .where('entityId', '==', docRef.id)
                .where('action', '==', 'update')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
            const auditDoc = auditSnap.docs[0]?.data();
            expect(auditDoc?.newData?.ragione_sociale).to.equal('Cliente New');
            expect(auditDoc?.newData?.codice).to.equal('CL-NEW-02');
        });
    });

    describe('deleteClienteApi', () => {
        it('dovrebbe negare a un operatore l\'eliminazione di un cliente', async () => {
            const wrapped = test.wrap(deleteClienteApi);
            const user = { uid: 'operatore-delete', token: { email: 'op-delete@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'operatore' });

            try {
                await wrapped({ data: { id: 'cliente-id' }, auth: user });
                expect.fail('La funzione non ha lanciato un errore per operatore');
            } catch (error) {
                expect(error.code).to.equal('permission-denied');
            }
        });

        it('dovrebbe validare la presenza dell\'ID cliente', async () => {
            const wrapped = test.wrap(deleteClienteApi);
            const user = { uid: 'admin-delete-missing', token: { email: 'admin-delete-missing@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

            try {
                await wrapped({ data: {}, auth: user });
                expect.fail('La funzione non ha validato l\'ID');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe permettere a un admin di eliminare un cliente', async () => {
            const wrapped = test.wrap(deleteClienteApi);
            const user = { uid: 'admin-delete', token: { email: 'admin-delete@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

            const docRef = await db.collection(CLIENTI).add({ ragione_sociale: 'Cliente Delete' });

            const result = await wrapped({ data: { id: docRef.id }, auth: user });

            expect(result.message).to.equal('Cliente eliminato con successo.');

            const deletedDoc = await db.collection(CLIENTI).doc(docRef.id).get();
            expect(deletedDoc.exists).to.equal(false);

            const auditSnap = await db.collection(AUDIT_LOGS)
                .where('entityType', '==', CLIENTI)
                .where('entityId', '==', docRef.id)
                .where('action', '==', 'delete')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
            const auditDoc = auditSnap.docs[0]?.data();
            expect(auditDoc?.oldData?.ragione_sociale).to.equal('Cliente Delete');
        });
    });
});
