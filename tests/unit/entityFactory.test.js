import { createAttachment } from '../../shared/schemas/entityFactory.js';
import { faker } from '@faker-js/faker';

describe('Unit Test: entityFactory', () => {
  describe('createAttachment', () => {
    it('dovrebbe creare un attachment valido con i dati forniti', () => {
      const data = {
        nome: 'Test Document.pdf',
        tipo: 'application/pdf',
        storagePath: `documenti/${faker.string.uuid()}/Test Document.pdf`,
        createdBy: faker.string.uuid()
      };

      const attachment = createAttachment(data);

      expect(attachment).toHaveProperty('nome', 'Test Document.pdf');
      expect(attachment).toHaveProperty('createdAt');
      expect(typeof attachment.createdAt).toBe('string');
      expect(typeof attachment.updatedAt).toBe('string');
      expect(attachment.storagePath).toContain('documenti/');
    });
  });
});
