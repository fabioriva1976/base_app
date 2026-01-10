/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  // Aggiungiamo i percorsi dove Jest deve cercare i file di test.
  // In questo modo, eseguirà sia i test unitari che quelli di integrazione.
  testMatch: ['**/tests/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/.firebase-credentials/'],
  // Esegui in singolo worker per evitare interferenze tra suite che usano gli emulatori.
  maxWorkers: 1,
  // Silenzia console.* durante i test; gli errori restano nel report di Jest.
  silent: true,
  // Rileva handle aperti per evitare warning a fine run.
  detectOpenHandles: true,
  // Eventuali altre configurazioni, come transform per TypeScript, ecc.
  // setupFilesAfterEnv: ['./jest.setup.js'],
};
