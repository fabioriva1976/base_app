// NOTE: quando copi in tests/functions, verifica i path relativi degli import.
import { describe, it, beforeAll, beforeEach, afterEach, afterAll, jest } from '@jest/globals';
import { expect } from 'chai';
import fft from 'firebase-functions-test';
import admin from 'firebase-admin';
import { COLLECTIONS } from '../../shared/constants/collections.ts';
import { clearAllEmulatorData } from '../helpers/cleanup.ts';
import { seedUserProfile } from '../helpers/userProfile.ts';

const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || 'base-app-12108';
process.env.FIREBASE_PROJECT_ID = TEST_PROJECT_ID;
process.env.GCLOUD_PROJECT = TEST_PROJECT_ID;
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

const test = fft({ projectId: TEST_PROJECT_ID });

const ENTITY_COLLECTION = COLLECTIONS.__ENTITA_CONST__;
const AUDIT_LOGS = COLLECTIONS.AUDIT_LOGS;

let create__ENTITY_PASCAL__Api;
let update__ENTITY_PASCAL__Api;
let delete__ENTITY_PASCAL__Api;

describe('API __ENTITY_LABEL__', () => {
  jest.setTimeout(30000);

  let db;

  beforeAll(async () => {
    if (admin.apps.length > 0) {
      await Promise.all(admin.apps.map(app => app.delete()));
    }
    admin.initializeApp({ projectId: TEST_PROJECT_ID });
    db = admin.firestore();
    ({ create__ENTITY_PASCAL__Api, update__ENTITY_PASCAL__Api, delete__ENTITY_PASCAL__Api } = await import('../../functions/api/__ENTITA_SNAKE__.ts'));
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

  describe('create__ENTITY_PASCAL__Api', () => {
    it('dovrebbe negare a un operatore la creazione', async () => {
      const wrapped = test.wrap(create__ENTITY_PASCAL__Api);
      const user = { uid: 'operatore-test', token: { email: 'op@test.com' } };

      await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'operatore' });

      try {
        await wrapped({ data: { campo_obbligatorio: 'Test' }, auth: user });
        expect.fail('La funzione non ha lanciato un errore per operatore');
      } catch (error) {
        expect(error.code).to.equal('permission-denied');
      }
    });

    it('dovrebbe permettere a un admin di creare', async () => {
      const wrapped = test.wrap(create__ENTITY_PASCAL__Api);
      const user = { uid: 'admin-test', token: { email: 'admin@test.com' } };

      await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

      const result = await wrapped({ data: { campo_obbligatorio: 'Test' }, auth: user });

      expect(result.id).to.be.a('string');

      const doc = await db.collection(ENTITY_COLLECTION).doc(result.id).get();
      expect(doc.exists).to.be.true;
    });
  });

  describe('update__ENTITY_PASCAL__Api', () => {
    it('dovrebbe validare la presenza dell\'ID', async () => {
      const wrapped = test.wrap(update__ENTITY_PASCAL__Api);
      const user = { uid: 'admin-update', token: { email: 'admin-update@test.com' } };

      await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

      try {
        await wrapped({ data: { campo_obbligatorio: 'Test' }, auth: user });
        expect.fail('La funzione non ha validato l\'ID');
      } catch (error) {
        expect(error.code).to.equal('invalid-argument');
      }
    });
  });

  describe('delete__ENTITY_PASCAL__Api', () => {
    it('dovrebbe permettere a un admin di eliminare', async () => {
      const wrapped = test.wrap(delete__ENTITY_PASCAL__Api);
      const user = { uid: 'admin-delete', token: { email: 'admin-delete@test.com' } };

      await seedUserProfile(db, { uid: user.uid, email: user.token.email, role: 'admin' });

      const docRef = await db.collection(ENTITY_COLLECTION).add({ campo_obbligatorio: 'Test' });
      const result = await wrapped({ data: { id: docRef.id }, auth: user });

      expect(result.message).to.be.a('string');

      const auditSnap = await db.collection(AUDIT_LOGS)
        .where('entityType', '==', ENTITY_COLLECTION)
        .where('entityId', '==', docRef.id)
        .where('action', '==', 'delete')
        .limit(1)
        .get();
      expect(auditSnap.empty).to.equal(false);
    });
  });
});
