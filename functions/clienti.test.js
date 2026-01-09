import { describe, it, beforeAll, afterEach } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'base-app-12108-test';
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Inizializza firebase-functions-test.
// Puntiamo al file di configurazione corretto per gli emulatori.
const test = fft({ projectId: TEST_PROJECT_ID });

let listClientiApi;
let clienteCreateApi;

describe('API Clienti', () => {
    let db;

    // Prima di tutti i test, inizializziamo l'app admin
    beforeAll(async () => {
        if (admin.apps.length === 0) {
            admin.initializeApp({ projectId: TEST_PROJECT_ID });
        }
        db = admin.firestore();
        ({ listClientiApi, clienteCreateApi } = await import('./api/clienti.js'));
    });

    // Dopo ogni test, puliamo il database per garantire l'isolamento
    afterEach(async () => {
        await test.cleanup();
        // Pulisci le collezioni usate nei test
        const clientiSnap = await db.collection('anagrafica_clienti').get();
        const utentiSnap = await db.collection('utenti').get();
        const deletePromises = [];
        clientiSnap.forEach(doc => deletePromises.push(doc.ref.delete()));
        utentiSnap.forEach(doc => deletePromises.push(doc.ref.delete()));
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
            const wrapped = test.wrap(clienteCreateApi);
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
            const wrapped = test.wrap(clienteCreateApi);
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
        });

        it('dovrebbe lanciare un errore se la ragione sociale manca', async () => {
            const wrapped = test.wrap(clienteCreateApi);
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
});
