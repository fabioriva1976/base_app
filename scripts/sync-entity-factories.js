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
const SOURCE_ENTITY_FACTORY = path.join(__dirname, '../shared/schemas/entityFactory.ts');
const TARGET_ENTITY_FACTORY = path.join(__dirname, '../functions/schemas/entityFactory.ts');
const SOURCE_ZOD_SCHEMAS = path.join(__dirname, '../shared/schemas/zodSchemas.ts');
const TARGET_ZOD_SCHEMAS = path.join(__dirname, '../functions/schemas/zodSchemas.ts');
console.log('🔄 Sincronizzazione entityFactory.ts...');
try {
    if (!fs.existsSync(SOURCE_ENTITY_FACTORY)) {
        console.warn(`⚠️  File sorgente non trovato: ${SOURCE_ENTITY_FACTORY}. Salto la sincronizzazione.`);
        process.exit(0);
    }
    const entityFactoryContent = fs.readFileSync(SOURCE_ENTITY_FACTORY, 'utf8');
    const header = `/**
 * Factory functions per creare entità con struttura consistente.
 *
 * NOTA: Questo file è AUTO-GENERATO da /shared/schemas/entityFactory.ts
 * Non modificare direttamente questo file! Modifica il file sorgente e riesegui:
 * npm run sync-factories
 */

`;
    fs.writeFileSync(TARGET_ENTITY_FACTORY, header + entityFactoryContent);
    if (fs.existsSync(SOURCE_ZOD_SCHEMAS)) {
        const zodSchemasContent = fs.readFileSync(SOURCE_ZOD_SCHEMAS, 'utf8');
        const zodHeader = `/**
 * Schemi Zod condivisi.
 *
 * NOTA: Questo file è AUTO-GENERATO da /shared/schemas/zodSchemas.ts
 * Non modificare direttamente questo file! Modifica il file sorgente e riesegui:
 * npm run sync-factories
 */

`;
        fs.writeFileSync(TARGET_ZOD_SCHEMAS, zodHeader + zodSchemasContent);
    }
    console.log('✅ Sincronizzazione completata!');
    console.log(`   Sorgente: ${SOURCE_ENTITY_FACTORY}`);
    console.log(`   Target:   ${TARGET_ENTITY_FACTORY}`);
    if (fs.existsSync(SOURCE_ZOD_SCHEMAS)) {
        console.log(`   Sorgente: ${SOURCE_ZOD_SCHEMAS}`);
        console.log(`   Target:   ${TARGET_ZOD_SCHEMAS}`);
    }
}
catch (error) {
    console.error('❌ Errore durante la sincronizzazione:', error instanceof Error ? error.message : error);
    process.exit(1);
}
