import { describe, it, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';
import { COLLECTIONS } from '../../shared/constants/collections.js';
import { clearAllEmulatorData } from '../helpers/cleanup.js';
import { seedUserProfile } from '../helpers/userProfile.js';

const { USERS, ATTACHMENTS, AUDIT_LOGS, CLIENTI } = COLLECTIONS;

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
if (!TEST_PROJECT_ID) {
  throw new Error('Missing env var: TEST_PROJECT_ID or FIREBASE_PROJECT_ID');
}
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9299';

const test = fft({ projectId: TEST_PROJECT_ID });

let createAttachmentRecordApi;
let updateAttachmentApi;
let deleteAttachmentApi;

describe('API Attachments', () => {
    jest.setTimeout(30000);

    let db;
    let storage;

    beforeAll(async () => {
        if (admin.apps.length > 0) {
            await Promise.all(admin.apps.map(app => app.delete()));
        }
        admin.initializeApp({
            projectId: TEST_PROJECT_ID,
            storageBucket: `${TEST_PROJECT_ID}.appspot.com`
        });
        db = admin.firestore();
        storage = admin.storage();
        ({ createAttachmentRecordApi, updateAttachmentApi, deleteAttachmentApi } = await import('../../functions/api/attachments.js'));
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
        await clearAllEmulatorData({ db, storage });
    });

    afterEach(async () => {
        await test.cleanup();
        await clearAllEmulatorData({ db, storage });
    });

    describe('createAttachmentRecordApi', () => {
        it('dovrebbe negare la creazione senza autenticazione', async () => {
            const wrapped = test.wrap(createAttachmentRecordApi);

            try {
                await wrapped({ data: {} });
                expect.fail('La funzione non ha lanciato un errore per utente non autenticato');
            } catch (error) {
                expect(error.code).to.equal('unauthenticated');
            }
        });

        it('dovrebbe validare i campi obbligatori', async () => {
            const wrapped = test.wrap(createAttachmentRecordApi);
            const user = { uid: 'user-attach', token: { email: 'user-attach@test.com' } };

            try {
                await wrapped({ data: { tipo: 'application/pdf' }, auth: user });
                expect.fail('La funzione non ha validato i campi obbligatori');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe creare un attachment e registrare l\'audit log', async () => {
            const wrapped = test.wrap(createAttachmentRecordApi);
            const user = { uid: 'user-attach-create', token: { email: 'user-attach-create@test.com' } };
            const payload = {
                nome: 'file.pdf',
                tipo: 'application/pdf',
                storagePath: 'attachments/clienti/file.pdf',
                metadata: {
                    entityCollection: CLIENTI,
                    entityId: 'cliente-1'
                }
            };

            const result = await wrapped({ data: payload, auth: user });

            expect(result.success).to.equal(true);
            expect(result.id).to.be.a('string');

            const doc = await db.collection(ATTACHMENTS).doc(result.id).get();
            expect(doc.exists).to.equal(true);
            expect(doc.data().nome).to.equal('file.pdf');

            const auditSnap = await db.collection(AUDIT_LOGS)
                .where('entityType', '==', CLIENTI)
                .where('entityId', '==', 'cliente-1')
                .where('action', '==', 'create')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
            const auditDoc = auditSnap.docs[0]?.data();
            expect(auditDoc?.newData?.attachmentName).to.equal('file.pdf');
        });
    });

    describe('updateAttachmentApi', () => {
        it('dovrebbe negare l\'aggiornamento a un non admin', async () => {
            const wrapped = test.wrap(updateAttachmentApi);
            const user = { uid: 'operatore-attach-update', token: { email: 'op-attach-update@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'operatore' });

            try {
                await wrapped({ data: { id: 'attachment-id', nome: 'Nuovo Nome' }, auth: user });
                expect.fail('La funzione non ha lanciato un errore per utente non admin');
            } catch (error) {
                expect(error.code).to.equal('permission-denied');
            }
        });

        it('dovrebbe validare la presenza dell\'ID', async () => {
            const wrapped = test.wrap(updateAttachmentApi);
            const adminUser = { uid: 'admin-attach-update-missing', token: { email: 'admin-attach-update-missing@test.com' } };

            await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

            try {
                await wrapped({ data: { nome: 'Nuovo Nome' }, auth: adminUser });
                expect.fail('La funzione non ha validato l\'ID');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe aggiornare un attachment e registrare l\'audit log', async () => {
            const createWrapped = test.wrap(createAttachmentRecordApi);
            const updateWrapped = test.wrap(updateAttachmentApi);
            const user = { uid: 'user-attach-update', token: { email: 'user-attach-update@test.com' } };
            const adminUser = { uid: 'admin-attach-update', token: { email: 'admin-attach-update@test.com' } };

            await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

            const created = await createWrapped({
                data: {
                    nome: 'file-update.pdf',
                    tipo: 'application/pdf',
                    storagePath: 'attachments/clienti/file-update.pdf',
                    metadata: { entityCollection: CLIENTI, entityId: 'cliente-2' }
                },
                auth: user
            });

            const result = await updateWrapped({
                data: { id: created.id, nome: 'file-update-new.pdf' },
                auth: adminUser
            });

            expect(result.message).to.equal('Documento aggiornato con successo.');

            const updatedDoc = await db.collection(ATTACHMENTS).doc(created.id).get();
            expect(updatedDoc.data().nome).to.equal('file-update-new.pdf');

            const auditSnap = await db.collection(AUDIT_LOGS)
                .where('entityType', '==', ATTACHMENTS)
                .where('entityId', '==', created.id)
                .where('action', '==', 'update')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
            const auditDoc = auditSnap.docs[0]?.data();
            expect(auditDoc?.newData?.nome).to.equal('file-update-new.pdf');
        });
    });

    describe('deleteAttachmentApi', () => {
        it('dovrebbe negare l\'eliminazione a un non admin', async () => {
            const wrapped = test.wrap(deleteAttachmentApi);
            const user = { uid: 'operatore-attach-delete', token: { email: 'op-attach-delete@test.com' } };

            await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'operatore' });

            try {
                await wrapped({ data: { docId: 'attachment-id', storagePath: 'attachments/x.pdf' }, auth: user });
                expect.fail('La funzione non ha lanciato un errore per utente non admin');
            } catch (error) {
                expect(error.code).to.equal('permission-denied');
            }
        });

        it('dovrebbe validare i parametri obbligatori', async () => {
            const wrapped = test.wrap(deleteAttachmentApi);
            const adminUser = { uid: 'admin-attach-delete-missing', token: { email: 'admin-attach-delete-missing@test.com' } };

            await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

            try {
                await wrapped({ data: { docId: 'attachment-id' }, auth: adminUser });
                expect.fail('La funzione non ha validato i parametri');
            } catch (error) {
                expect(error.code).to.equal('invalid-argument');
            }
        });

        it('dovrebbe eliminare un attachment e registrare l\'audit log', async () => {
            const createWrapped = test.wrap(createAttachmentRecordApi);
            const deleteWrapped = test.wrap(deleteAttachmentApi);
            const user = { uid: 'user-attach-delete', token: { email: 'user-attach-delete@test.com' } };
            const adminUser = { uid: 'admin-attach-delete', token: { email: 'admin-attach-delete@test.com' } };

            await seedUserProfile(db, { uid: adminUser.uid, email: adminUser.token.email, role: 'admin' });

            const created = await createWrapped({
                data: {
                    nome: 'file-delete.pdf',
                    tipo: 'application/pdf',
                    storagePath: 'attachments/clienti/file-delete.pdf',
                    metadata: { entityCollection: CLIENTI, entityId: 'cliente-3' }
                },
                auth: user
            });

            const result = await deleteWrapped({
                data: { docId: created.id, storagePath: created.storagePath },
                auth: adminUser
            });

            expect(result.success).to.equal(true);

            const deletedDoc = await db.collection(ATTACHMENTS).doc(created.id).get();
            expect(deletedDoc.exists).to.equal(false);

            const auditSnap = await db.collection(AUDIT_LOGS)
                .where('entityType', '==', CLIENTI)
                .where('entityId', '==', 'cliente-3')
                .where('action', '==', 'delete')
                .limit(1)
                .get();
            expect(auditSnap.empty).to.equal(false);
            const auditDoc = auditSnap.docs[0]?.data();
            expect(auditDoc?.oldData?.attachmentName).to.equal('file-delete.pdf');
        });
    });
});
