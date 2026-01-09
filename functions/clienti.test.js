import { describe, it, beforeAll, afterEach, afterAll, jest } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'base-app-12108';
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Inizializza firebase-functions-test.
// Puntiamo al file di configurazione corretto per gli emulatori.
const test = fft({ projectId: TEST_PROJECT_ID });

let listClientiApi;
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
        ({ listClientiApi, createClienteApi, updateClienteApi, deleteClienteApi } = await import('./api/clienti.js'));
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

    // Dopo ogni test, puliamo il database per garantire l'isolamento
    afterEach(async () => {
        await test.cleanup();
        // Pulisci le collezioni usate nei test
        const clientiSnap = await db.collection('anagrafica_clienti').get();
        const utentiSnap = await db.collection('utenti').get();
        const auditSnap = await db.collection('audit_logs').get();
        const deletePromises = [];
        clientiSnap.forEach(doc => deletePromises.push(doc.ref.delete()));
        utentiSnap.forEach(doc => deletePromises.push(doc.ref.delete()));
        auditSnap.forEach(doc => deletePromises.push(doc.ref.delete()));
        await Promise.all(deletePromises);
    });

    describe('listClientiApi', () => {
        it('dovrebbe negare l-accesso a un utente non autenticato', async () => {
            const wrapped = test.wrap(listClientiApi);
            try {
                await wrapped({ data: {} });
                // Se non lancia un errore, il test fallisce
                expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
            } catch (error) {
                expect(error.code).to.equal('unauthenticated');
            }
        });

        it('dovrebbe negare l-accesso a un utente senza ruolo', async () => {
            const wrapped = test.wrap(listClientiApi);
            const user = { uid: 'user-senza-ruolo', token: { email: 'test@test.com' } };

            try {
                await wrapped({ data: {}, auth: user });
                expect.fail('La funzione non ha lanciato un errore per utente senza ruolo');
            } catch (error) {
                expect(error.code).to.equal('permission-denied');
            }
        });

        it('dovrebbe permettere a un operatore di listare i clienti', async () => {
            const wrapped = test.wrap(listClientiApi);
            const user = { uid: 'operatore-test', token: { email: 'op@test.com' } };

            // Crea l'utente e il cliente nel DB emulato
            await db.collection('utenti').doc(user.uid).set({ ruolo: ['operatore'] });
            await db.collection('anagrafica_clienti').add({ ragione_sociale: 'Cliente Test 1' });

            const result = await wrapped({ data: {}, auth: user });

            expect(result.clienti).to.be.an('array').with.lengthOf(1);
            expect(result.clienti[0].ragione_sociale).to.equal('Cliente Test 1');
        });
    });

    describe('clienteCreateApi', () => {
        it('dovrebbe negare a un operatore la creazione di un cliente', async () => {
            const wrapped = test.wrap(createClienteApi);
            const user = { uid: 'operatore-test', token: { email: 'op@test.com' } };
            const clienteData = { ragione_sociale: 'Nuovo Cliente' };

            // Crea l'utente operatore nel DB emulato
            await db.collection('utenti').doc(user.uid).set({ ruolo: ['operatore'] });

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
            const clienteData = { ragione_sociale: 'Nuovo Cliente da Admin', email: 'cliente@test.com' };

            // Crea l'utente admin nel DB emulato
            await db.collection('utenti').doc(user.uid).set({ ruolo: ['admin'] });

            const result = await wrapped({ data: clienteData, auth: user });

            expect(result.id).to.be.a('string');
            expect(result.ragione_sociale).to.equal('Nuovo Cliente da Admin');

            // Verifica che il cliente sia stato effettivamente scritto nel database
            const doc = await db.collection('anagrafica_clienti').doc(result.id).get();
            expect(doc.exists).to.be.true;
            expect(doc.data().ragione_sociale).to.equal('Nuovo Cliente da Admin');

            // Verifica audit log di creazione
            const auditSnap = await db.collection('audit_logs')
                .where('entityType', '==', 'clienti')
                .where('entityId', '==', result.id)
                .where('action', '==', 'create')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
        });

        it('dovrebbe lanciare un errore se la ragione sociale manca', async () => {
            const wrapped = test.wrap(createClienteApi);
            const user = { uid: 'admin-test', token: { email: 'admin@test.com' } };
            const clienteData = { email: 'cliente@test.com' }; // Manca ragione_sociale

            await db.collection('utenti').doc(user.uid).set({ ruolo: ['admin'] });

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

            await db.collection('utenti').doc(user.uid).set({ ruolo: ['operatore'] });

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

            await db.collection('utenti').doc(user.uid).set({ ruolo: ['admin'] });

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

            await db.collection('utenti').doc(user.uid).set({ ruolo: ['admin'] });

            const docRef = await db.collection('anagrafica_clienti').add({ ragione_sociale: 'Cliente Old' });

            try {
                await wrapped({
                    data: { id: docRef.id, ragione_sociale: 'Cliente New', email: 'not-an-email' },
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

            await db.collection('utenti').doc(user.uid).set({ ruolo: ['admin'] });

            const docRef = await db.collection('anagrafica_clienti').add({ ragione_sociale: 'Cliente Old' });

            const result = await wrapped({
                data: { id: docRef.id, ragione_sociale: 'Cliente New', email: 'cliente@update.com' },
                auth: user
            });

            expect(result.message).to.equal('Cliente aggiornato con successo.');

            const updatedDoc = await db.collection('anagrafica_clienti').doc(docRef.id).get();
            expect(updatedDoc.data().ragione_sociale).to.equal('Cliente New');

            const auditSnap = await db.collection('audit_logs')
                .where('entityType', '==', 'clienti')
                .where('entityId', '==', docRef.id)
                .where('action', '==', 'update')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
        });
    });

    describe('deleteClienteApi', () => {
        it('dovrebbe negare a un operatore l\'eliminazione di un cliente', async () => {
            const wrapped = test.wrap(deleteClienteApi);
            const user = { uid: 'operatore-delete', token: { email: 'op-delete@test.com' } };

            await db.collection('utenti').doc(user.uid).set({ ruolo: ['operatore'] });

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

            await db.collection('utenti').doc(user.uid).set({ ruolo: ['admin'] });

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

            await db.collection('utenti').doc(user.uid).set({ ruolo: ['admin'] });

            const docRef = await db.collection('anagrafica_clienti').add({ ragione_sociale: 'Cliente Delete' });

            const result = await wrapped({ data: { id: docRef.id }, auth: user });

            expect(result.message).to.equal('Cliente eliminato con successo.');

            const deletedDoc = await db.collection('anagrafica_clienti').doc(docRef.id).get();
            expect(deletedDoc.exists).to.equal(false);

            const auditSnap = await db.collection('audit_logs')
                .where('entityType', '==', 'clienti')
                .where('entityId', '==', docRef.id)
                .where('action', '==', 'delete')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
        });
    });
});
