/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  // Aggiungiamo i percorsi dove Jest deve cercare i file di test.
  // In questo modo, eseguirà sia i test unitari che quelli di integrazione.
  testMatch: ['**/tests/**/*.test.js', '**/functions/**/*.test.js'],
  // Eventuali altre configurazioni, come transform per TypeScript, ecc.
  // setupFilesAfterEnv: ['./jest.setup.js'],
};