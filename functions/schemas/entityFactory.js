/**
 * Re-esporta le factory condivise per l'ambiente CommonJS delle Cloud Functions.
 *
 * Questo file importa dinamicamente le funzioni dal modulo ES (`/shared`)
 * e le esporta usando `module.exports`, rendendole compatibili con il resto
 * del backend senza bisogno di script di sincronizzazione o codice duplicato.
 */

// NOTA: Non è più necessario usare `import()` dinamico perché `package.json`
// nella cartella `functions` è stato impostato con `"type": "module"`.
// Questo permette di usare direttamente `import` e `export`.
export * from '../../shared/schemas/entityFactory.js';
