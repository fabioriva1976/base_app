#!/usr/bin/env node

/**
 * Script per sincronizzare entityFactory.ts tra frontend e backend.
 *
 * Copia il file sorgente mantenendo ES modules per compatibilità Node ESM.
 *
 * Usage: node scripts/sync-entity-factories.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.join(__dirname, '../shared/schemas/entityFactory.ts');
const TARGET_FILE = path.join(__dirname, '../functions/schemas/entityFactory.ts');

console.log('🔄 Sincronizzazione entityFactory.ts...');

try {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.warn(`⚠️  File sorgente non trovato: ${SOURCE_FILE}. Salto la sincronizzazione.`);
    process.exit(0);
  }

  const content = fs.readFileSync(SOURCE_FILE, 'utf8');

  const header = `/**
 * Factory functions per creare entità con struttura consistente.
 *
 * NOTA: Questo file è AUTO-GENERATO da /shared/schemas/entityFactory.ts
 * Non modificare direttamente questo file! Modifica il file sorgente e riesegui:
 * npm run sync-factories
 */

`;

  fs.writeFileSync(TARGET_FILE, header + content);

  console.log('✅ Sincronizzazione completata!');
  console.log(`   Sorgente: ${SOURCE_FILE}`);
  console.log(`   Target:   ${TARGET_FILE}`);
} catch (error) {
  console.error('❌ Errore durante la sincronizzazione:', error instanceof Error ? error.message : error);
  process.exit(1);
}
