#!/usr/bin/env node

/**
 * Script per sincronizzare entityFactory.js tra frontend e backend
 *
 * Legge il file ES6 del frontend e lo converte in CommonJS per le Cloud Functions
 *
 * Usage: node scripts/sync-entity-factories.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '../src/scripts/schemas/entityFactory.js');
const TARGET_FILE = path.join(__dirname, '../functions/schemas/entityFactory.js');

console.log('🔄 Sincronizzazione entityFactory.js...');

try {
  // Leggi il file sorgente (ES6)
  let content = fs.readFileSync(SOURCE_FILE, 'utf8');

  // Header per il file target
  const header = `/**
 * Factory functions per creare entità con struttura consistente
 *
 * NOTA: Questo file è AUTO-GENERATO da /src/scripts/schemas/entityFactory.js
 * Non modificare direttamente questo file! Modifica il file sorgente e riesegui:
 * npm run sync-factories
 *
 * Mantiene la stessa logica ma usa CommonJS (module.exports) invece di ES6 modules (export)
 * per compatibilità con le Cloud Functions Node.js.
 */

`;

  // Rimuovi il vecchio header del file frontend
  content = content.replace(/^\/\*\*[\s\S]*?\*\/\n\n/, '');

  // Converti export function -> function
  content = content.replace(/export function /g, 'function ');

  // Estrai i nomi delle funzioni esportate
  const functionNames = [];
  const functionRegex = /function\s+(\w+)\s*\(/g;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    functionNames.push(match[1]);
  }

  // Crea l'export CommonJS
  const exportsBlock = `
module.exports = {
${functionNames.map(name => `  ${name},`).join('\n')}
};
`;

  // Assembla il file finale
  const finalContent = header + content + exportsBlock;

  // Scrivi il file target
  fs.writeFileSync(TARGET_FILE, finalContent);

  console.log('✅ Sincronizzazione completata!');
  console.log(`   Sorgente: ${SOURCE_FILE}`);
  console.log(`   Target:   ${TARGET_FILE}`);
  console.log(`   Funzioni sincronizzate: ${functionNames.join(', ')}`);

} catch (error) {
  console.error('❌ Errore durante la sincronizzazione:', error.message);
  process.exit(1);
}
