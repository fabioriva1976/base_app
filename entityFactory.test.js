import { createDocumento } from '../../../shared/schemas/entityFactory.js';
import { faker } from '@faker-js/faker';

describe('Unit Test: entityFactory', () => {

  describe('createDocumento', () => {

    it('dovrebbe creare un oggetto documento valido con i dati forniti', () => {
      const data = {
        nome: 'Test Document.pdf',
        tipo: 'application/pdf',
        storagePath: `documenti/${faker.string.uuid()}/Test Document.pdf`,
        createdBy: faker.string.uuid(),
      };

      const doc = createDocumento(data);

      expect(doc).toHaveProperty('nome', 'Test Document.pdf');
      expect(doc).toHaveProperty('createdAt');
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeInstanceOf(Date);
      expect(doc.storagePath).toContain('documenti/');
    });
  });
});