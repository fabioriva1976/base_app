import {
  createAttachment,
  createCliente,
  createUtente,
  createComment,
  SYSTEM_USER
} from '../../shared/schemas/entityFactory.js';
import { faker } from '@faker-js/faker';

describe('Unit Test: entityFactory', () => {
  describe('createAttachment', () => {
    it('dovrebbe creare un attachment con audit fields quando createdBy è fornito', () => {
      const userId = faker.string.uuid();
      const userEmail = faker.internet.email();
      const data = {
        nome: 'Test Document.pdf',
        tipo: 'application/pdf',
        storagePath: `documenti/${faker.string.uuid()}/Test Document.pdf`,
        createdBy: userId,
        createdByEmail: userEmail
      };

      const attachment = createAttachment(data);

      expect(attachment).toHaveProperty('nome', 'Test Document.pdf');
      expect(attachment).toHaveProperty('tipo', 'application/pdf');
      expect(attachment).toHaveProperty('created');
      expect(attachment).toHaveProperty('changed');
      // Timestamp sono null (placeholder per FieldValue.serverTimestamp())
      expect(attachment.created).toBe(null);
      expect(attachment.changed).toBe(null);
      expect(attachment.storagePath).toContain('documenti/');

      // Verifica audit fields
      expect(attachment.createdBy).toBe(userId);
      expect(attachment.createdByEmail).toBe(userEmail.toLowerCase());
      expect(attachment.lastModifiedBy).toBe(userId);
      expect(attachment.lastModifiedByEmail).toBe(userEmail.toLowerCase());
    });

    it('dovrebbe usare SYSTEM quando createdBy non è fornito', () => {
      const data = {
        nome: 'Auto Document.pdf',
        tipo: 'application/pdf',
        storagePath: 'documenti/auto/Auto Document.pdf'
      };

      const attachment = createAttachment(data);

      expect(attachment.createdBy).toBe(SYSTEM_USER.id);
      expect(attachment.createdByEmail).toBe(SYSTEM_USER.email);
      expect(attachment.lastModifiedBy).toBe(SYSTEM_USER.id);
      expect(attachment.lastModifiedByEmail).toBe(SYSTEM_USER.email);
    });
  });

  describe('createCliente', () => {
    it('dovrebbe creare un cliente con audit fields completi', () => {
      const userId = faker.string.uuid();
      const userEmail = faker.internet.email();
      const data = {
        ragione_sociale: 'Test Corporation',
        codice: 'TC001',
        email: faker.internet.email(),
        createdBy: userId,
        createdByEmail: userEmail
      };

      const cliente = createCliente(data);

      expect(cliente.ragione_sociale).toBe('Test Corporation');
      expect(cliente.codice).toBe('TC001');
      expect(cliente).toHaveProperty('created');
      expect(cliente).toHaveProperty('changed');
      // Timestamp sono null (placeholder per FieldValue.serverTimestamp())
      expect(cliente.created).toBe(null);
      expect(cliente.changed).toBe(null);

      // Verifica audit fields
      expect(cliente.createdBy).toBe(userId);
      expect(cliente.createdByEmail).toBe(userEmail.toLowerCase());
      expect(cliente.lastModifiedBy).toBe(userId);
      expect(cliente.lastModifiedByEmail).toBe(userEmail.toLowerCase());
    });

    it('dovrebbe usare SYSTEM quando createdBy non è fornito', () => {
      const data = {
        ragione_sociale: 'Auto Import Corp',
        codice: 'AIC001'
      };

      const cliente = createCliente(data);

      expect(cliente.createdBy).toBe(SYSTEM_USER.id);
      expect(cliente.createdByEmail).toBe(SYSTEM_USER.email);
      expect(cliente.lastModifiedBy).toBe(SYSTEM_USER.id);
      expect(cliente.lastModifiedByEmail).toBe(SYSTEM_USER.email);
    });

    it('dovrebbe lanciare errore se mancano campi obbligatori', () => {
      expect(() => {
        createCliente({ ragione_sociale: 'Test' }); // Manca codice
      }).toThrow('codice è obbligatorio');

      expect(() => {
        createCliente({ codice: 'T001' }); // Manca ragione_sociale
      }).toThrow('ragione_sociale è obbligatorio');
    });
  });

  describe('createUtente', () => {
    it('dovrebbe creare un utente con audit fields completi', () => {
      const uid = faker.string.uuid();
      const email = faker.internet.email();
      const creatorId = faker.string.uuid();
      const creatorEmail = faker.internet.email();

      const utente = createUtente({
        uid,
        email,
        ruolo: 'admin',
        displayName: 'Test User',
        createdBy: creatorId,
        createdByEmail: creatorEmail
      });

      expect(utente.uid).toBe(uid);
      expect(utente.email).toBe(email.toLowerCase());
      expect(utente.ruolo).toEqual(['admin']);
      expect(utente).toHaveProperty('created');
      expect(utente).toHaveProperty('changed');
      // Timestamp sono null (placeholder per FieldValue.serverTimestamp())
      expect(utente.created).toBe(null);
      expect(utente.changed).toBe(null);

      // Verifica audit fields
      expect(utente.createdBy).toBe(creatorId);
      expect(utente.createdByEmail).toBe(creatorEmail.toLowerCase());
      expect(utente.lastModifiedBy).toBe(creatorId);
      expect(utente.lastModifiedByEmail).toBe(creatorEmail.toLowerCase());
    });

    it('dovrebbe usare SYSTEM quando createdBy non è fornito', () => {
      const uid = faker.string.uuid();
      const email = faker.internet.email();

      const utente = createUtente({
        uid,
        email
      });

      expect(utente.createdBy).toBe(SYSTEM_USER.id);
      expect(utente.createdByEmail).toBe(SYSTEM_USER.email);
      expect(utente.lastModifiedBy).toBe(SYSTEM_USER.id);
      expect(utente.lastModifiedByEmail).toBe(SYSTEM_USER.email);
    });
  });

  describe('createComment', () => {
    it('dovrebbe creare un commento con audit fields completi', () => {
      const userId = faker.string.uuid();
      const userEmail = faker.internet.email();
      const entityId = faker.string.uuid();

      const comment = createComment({
        text: 'Test comment',
        entityId,
        entityCollection: 'clienti',
        createdBy: userId,
        createdByEmail: userEmail
      });

      expect(comment.text).toBe('Test comment');
      expect(comment.entityId).toBe(entityId);
      expect(comment.entityCollection).toBe('clienti');
      expect(comment).toHaveProperty('created');
      expect(comment).toHaveProperty('changed');
      // Timestamp sono null (placeholder per FieldValue.serverTimestamp())
      expect(comment.created).toBe(null);
      expect(comment.changed).toBe(null);

      // Verifica audit fields
      expect(comment.createdBy).toBe(userId);
      expect(comment.createdByEmail).toBe(userEmail.toLowerCase());
      expect(comment.lastModifiedBy).toBe(userId);
      expect(comment.lastModifiedByEmail).toBe(userEmail.toLowerCase());
    });

    it('dovrebbe usare SYSTEM quando createdBy non è fornito', () => {
      const comment = createComment({
        text: 'Auto comment',
        entityId: faker.string.uuid(),
        entityCollection: 'clienti'
      });

      expect(comment.createdBy).toBe(SYSTEM_USER.id);
      expect(comment.createdByEmail).toBe(SYSTEM_USER.email);
      expect(comment.lastModifiedBy).toBe(SYSTEM_USER.id);
      expect(comment.lastModifiedByEmail).toBe(SYSTEM_USER.email);
    });
  });

  describe('SYSTEM_USER constant', () => {
    it('dovrebbe avere valori costanti predefiniti', () => {
      expect(SYSTEM_USER.id).toBe('SYSTEM');
      expect(SYSTEM_USER.email).toBe('system@internal');
    });
  });
});
