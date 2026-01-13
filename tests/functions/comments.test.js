import { describe, it, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';
import { COLLECTIONS } from '../../shared/constants/collections.js';
import { clearAllEmulatorData } from '../helpers/cleanup.js';

const { COMMENTS, AUDIT_LOGS, CLIENTI } = COLLECTIONS;

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
if (!TEST_PROJECT_ID) {
  throw new Error('Missing env var: TEST_PROJECT_ID or FIREBASE_PROJECT_ID');
}
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const test = fft({ projectId: TEST_PROJECT_ID });

let createCommentApi;
let getEntityCommentsApi;
let deleteCommentApi;

describe('API Comments', () => {
    jest.setTimeout(30000);

    let db;

    beforeAll(async () => {
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }
        admin.initializeApp({ projectId: TEST_PROJECT_ID });
        db = admin.firestore();
        ({ createCommentApi, getEntityCommentsApi, deleteCommentApi } = await import('../../functions/api/comments.js'));
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

    describe('createCommentApi', () => {
        it('dovrebbe negare la creazione senza autenticazione', async () => {
            const wrapped = test.wrap(createCommentApi);

            try {
                await wrapped({ data: {} });
                expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
            } catch (error) {
                expect(error.code).to.equal('unauthenticated');
            }
        });

        it('dovrebbe validare i campi obbligatori', async () => {
            const wrapped = test.wrap(createCommentApi);
            const user = { uid: 'user-comment', token: { email: 'user-comment@test.com' } };

            try {
                await wrapped({ data: { entityId: 'cliente-1', entityCollection: CLIENTI }, auth: user });
                expect.fail('La funzione non ha validato i campi obbligatori');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe creare un commento e registrare l\'audit log', async () => {
            const wrapped = test.wrap(createCommentApi);
            const user = { uid: 'user-comment-create', token: { email: 'user-comment-create@test.com' } };
            const payload = { text: 'Nota di test', entityId: 'cliente-1', entityCollection: CLIENTI };

            const result = await wrapped({ data: payload, auth: user });

            expect(result.success).to.equal(true);
            expect(result.id).to.be.a('string');

            const doc = await db.collection(COMMENTS).doc(result.id).get();
            expect(doc.exists).to.equal(true);
            expect(doc.data().text).to.equal('Nota di test');

            const auditSnap = await db.collection(AUDIT_LOGS)
                .where('entityType', '==', CLIENTI)
                .where('entityId', '==', 'cliente-1')
                .where('action', '==', 'create')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
            const auditDoc = auditSnap.docs[0]?.data();
            expect(auditDoc?.newData?.commentText).to.equal('Nota di test');
        });
    });

    describe('getEntityCommentsApi', () => {
        it('dovrebbe negare la lettura senza autenticazione', async () => {
            const wrapped = test.wrap(getEntityCommentsApi);

            try {
                await wrapped({ data: { entityId: 'cliente-1', entityCollection: CLIENTI } });
                expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
            } catch (error) {
                expect(error.code).to.equal('unauthenticated');
            }
        });

        it('dovrebbe validare i parametri obbligatori', async () => {
            const wrapped = test.wrap(getEntityCommentsApi);
            const user = { uid: 'user-comment-list', token: { email: 'user-comment-list@test.com' } };

            try {
                await wrapped({ data: { entityId: 'cliente-1' }, auth: user });
                expect.fail('La funzione non ha validato i parametri');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe restituire i commenti dell\'entità', async () => {
            const createWrapped = test.wrap(createCommentApi);
            const listWrapped = test.wrap(getEntityCommentsApi);
            const user = { uid: 'user-comment-list2', token: { email: 'user-comment-list2@test.com' } };

            await createWrapped({
                data: { text: 'Nota 1', entityId: 'cliente-2', entityCollection: CLIENTI },
                auth: user
            });
            await createWrapped({
                data: { text: 'Nota 2', entityId: 'cliente-2', entityCollection: CLIENTI },
                auth: user
            });

            const result = await listWrapped({
                data: { entityId: 'cliente-2', entityCollection: CLIENTI },
                auth: user
            });

            expect(result.success).to.equal(true);
            expect(result.comments).to.be.an('array').with.lengthOf(2);
        });
    });

    describe('deleteCommentApi', () => {
        it('dovrebbe validare la presenza di commentId', async () => {
            const wrapped = test.wrap(deleteCommentApi);
            const user = { uid: 'user-comment-delete-missing', token: { email: 'user-comment-delete-missing@test.com' } };

            try {
                await wrapped({ data: {}, auth: user });
                expect.fail('La funzione non ha validato commentId');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe negare l\'eliminazione a un utente non autorizzato', async () => {
            const createWrapped = test.wrap(createCommentApi);
            const deleteWrapped = test.wrap(deleteCommentApi);
            const author = { uid: 'user-comment-author', token: { email: 'author@test.com' } };
            const other = { uid: 'user-comment-other', token: { email: 'other@test.com' } };

            const created = await createWrapped({
                data: { text: 'Nota da autore', entityId: 'cliente-3', entityCollection: CLIENTI },
                auth: author
            });

            try {
                await deleteWrapped({ data: { commentId: created.id }, auth: other });
                expect.fail('La funzione non ha negato l\'eliminazione');
            } catch (error) {
                expect(error.code).to.equal('permission-denied');
            }
        });

        it('dovrebbe permettere al creatore di eliminare il commento', async () => {
            const createWrapped = test.wrap(createCommentApi);
            const deleteWrapped = test.wrap(deleteCommentApi);
            const user = { uid: 'user-comment-delete', token: { email: 'user-comment-delete@test.com' } };

            const created = await createWrapped({
                data: { text: 'Nota eliminabile', entityId: 'cliente-4', entityCollection: CLIENTI },
                auth: user
            });

            const result = await deleteWrapped({ data: { commentId: created.id }, auth: user });
            expect(result.success).to.equal(true);

            const doc = await db.collection(COMMENTS).doc(created.id).get();
            expect(doc.exists).to.equal(false);

            const auditSnap = await db.collection(AUDIT_LOGS)
                .where('entityType', '==', CLIENTI)
                .where('entityId', '==', 'cliente-4')
                .where('action', '==', 'delete')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
            const auditDoc = auditSnap.docs[0]?.data();
            expect(auditDoc?.oldData?.commentText).to.equal('Nota eliminabile');
        });

        it('dovrebbe permettere a un admin di eliminare il commento', async () => {
            const createWrapped = test.wrap(createCommentApi);
            const deleteWrapped = test.wrap(deleteCommentApi);
            const author = { uid: 'user-comment-author2', token: { email: 'author2@test.com' } };
            const adminUser = { uid: 'admin-comment-delete', token: { email: 'admin-comment-delete@test.com', admin: true } };

            const created = await createWrapped({
                data: { text: 'Nota admin', entityId: 'cliente-5', entityCollection: CLIENTI },
                auth: author
            });

            const result = await deleteWrapped({ data: { commentId: created.id }, auth: adminUser });
            expect(result.success).to.equal(true);
        });
    });
});
