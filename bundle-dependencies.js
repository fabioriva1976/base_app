import fs from 'fs/promises';
import path from 'path';

/**
 * Questo script analizza il codice compilato di Astro,
 * identifica tutte le dipendenze esterne necessarie e le copia
 * nella cartella functions/dist/node_modules per l'esecuzione su Firebase Functions.
 */

const rootDir = process.cwd();
const functionsDistDir = path.join(rootDir, 'functions', 'dist');

async function getAllFilesRecursive(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getAllFilesRecursive(fullPath));
    } else if (entry.name.endsWith('.mjs') || entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function isValidPackageName(name) {
  // Deve iniziare con lettera o @ e contenere solo caratteri validi per nomi di pacchetti npm
  return /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}

async function analyzeDependencies() {
  console.log('🔍 Analisi delle dipendenze dal codice compilato...');

  // Moduli built-in di Node.js che NON devono essere installati come dipendenze
  const nodeBuiltins = new Set([
    'fs', 'path', 'stream', 'util', 'events', 'buffer', 'crypto',
    'http', 'https', 'net', 'tls', 'os', 'url', 'querystring',
    'zlib', 'child_process', 'cluster', 'dgram', 'dns', 'tty',
    'readline', 'repl', 'vm', 'assert', 'constants', 'module',
    'timers', 'string_decoder', 'punycode', 'domain', 'v8',
    'process', 'inspector', 'async_hooks', 'perf_hooks', 'worker_threads'
  ]);

  try {
    const serverDir = path.join(functionsDistDir, 'server');

    // Verifica che la directory server esista
    try {
      await fs.access(serverDir);
    } catch {
      console.error('❌ La directory functions/dist/server non esiste. Build non completata.');
      process.exit(1);
    }

    // Leggi tutti i file compilati
    const serverFiles = await getAllFilesRecursive(serverDir);
    console.log(`📂 Analisi di ${serverFiles.length} file...`);

    // Estrai le dipendenze usando regex più precisa
    const importRegex = /(?:from|import)\s+['"]([^'"]+)['"]/g;
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    const dependencies = new Set();

    for (const file of serverFiles) {
      const content = await fs.readFile(file, 'utf-8');

      // Estrai import/export
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const dep = match[1];
        if (!dep.startsWith('.') && !dep.startsWith('node:') && !dep.startsWith('/')) {
          const parts = dep.split('/');
          const basePackage = dep.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
          // Escludi i moduli built-in di Node.js
          if (isValidPackageName(basePackage) && !nodeBuiltins.has(basePackage)) {
            dependencies.add(basePackage);
          }
        }
      }

      // Estrai require()
      importRegex.lastIndex = 0;
      while ((match = requireRegex.exec(content)) !== null) {
        const dep = match[1];
        if (!dep.startsWith('.') && !dep.startsWith('node:') && !dep.startsWith('/')) {
          const parts = dep.split('/');
          const basePackage = dep.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
          // Escludi i moduli built-in di Node.js
          if (isValidPackageName(basePackage) && !nodeBuiltins.has(basePackage)) {
            dependencies.add(basePackage);
          }
        }
      }
    }

    return Array.from(dependencies).sort();
  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error);
    process.exit(1);
  }
}

async function getPackageDependencies(pkgPath) {
  try {
    const packageJsonPath = path.join(pkgPath, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    return Object.keys(pkg.dependencies || {});
  } catch {
    return [];
  }
}

async function copyNodeModules(dependencies) {
  console.log(`\n📦 Trovate ${dependencies.length} dipendenze dirette:`);
  console.log(dependencies.join(', '));

  const sourceNodeModules = path.join(rootDir, 'node_modules');
  const destNodeModules = path.join(functionsDistDir, 'node_modules');

  // Verifica che node_modules del progetto principale esista
  try {
    await fs.access(sourceNodeModules);
  } catch {
    console.error('❌ node_modules non trovato nel progetto principale.');
    process.exit(1);
  }

  // Rimuovi eventuali node_modules esistenti in functions/dist
  try {
    await fs.rm(destNodeModules, { recursive: true, force: true });
  } catch (error) {
    // Ignora errori se la directory non esiste
  }

  await fs.mkdir(destNodeModules, { recursive: true });

  console.log('\n🚀 Copia in corso (con dipendenze transitive)...');
  let copied = 0;
  let notFound = 0;
  const allPackages = new Set(dependencies);
  const processed = new Set();

  // Funzione ricorsiva per copiare pacchetto e le sue dipendenze
  async function copyPackage(pkg) {
    if (processed.has(pkg)) return;
    processed.add(pkg);

    const srcPath = path.join(sourceNodeModules, pkg);
    const destPath = path.join(destNodeModules, pkg);

    try {
      await fs.access(srcPath);

      // Per pacchetti scoped (@xxx/yyy), crea prima la directory @xxx
      if (pkg.startsWith('@')) {
        const scopeDir = path.join(destNodeModules, pkg.split('/')[0]);
        await fs.mkdir(scopeDir, { recursive: true });
      }

      await fs.cp(srcPath, destPath, { recursive: true });
      console.log(`  ✓ ${pkg}`);
      copied++;

      // Trova e copia le dipendenze transitive
      const subDeps = await getPackageDependencies(srcPath);
      for (const subDep of subDeps) {
        if (!processed.has(subDep)) {
          allPackages.add(subDep);
          await copyPackage(subDep);
        }
      }
    } catch (error) {
      console.log(`  ⚠ ${pkg} non trovato`);
      notFound++;
    }
  }

  // Copia tutti i pacchetti e le loro dipendenze
  for (const pkg of dependencies) {
    await copyPackage(pkg);
  }

  console.log(`\n✅ Completato! Copiati: ${copied} pacchetti (incluse dipendenze transitive), Non trovati: ${notFound}`);
}

async function addToFunctionsPackageJson(dependencies) {
  console.log('\n📝 Aggiornamento functions/package.json...');

  const functionsPackageJsonPath = path.join(rootDir, 'functions', 'package.json');
  const rootPackageJsonPath = path.join(rootDir, 'package.json');

  try {
    // Leggi il package.json del progetto root per ottenere le versioni
    const rootPkgContent = await fs.readFile(rootPackageJsonPath, 'utf-8');
    const rootPkg = JSON.parse(rootPkgContent);
    const allRootDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies };

    // Leggi il package.json di functions
    const functionsPkgContent = await fs.readFile(functionsPackageJsonPath, 'utf-8');
    const functionsPkg = JSON.parse(functionsPkgContent);

    if (!functionsPkg.dependencies) {
      functionsPkg.dependencies = {};
    }

    let added = 0;

    // Aggiungi le dipendenze mancanti
    for (const dep of dependencies) {
      if (!functionsPkg.dependencies[dep]) {
        // Prendi la versione dal root package.json se disponibile
        const version = allRootDeps[dep] || 'latest';
        functionsPkg.dependencies[dep] = version;
        console.log(`  + ${dep}@${version}`);
        added++;
      }
    }

    if (added > 0) {
      // Scrivi il package.json aggiornato
      await fs.writeFile(
        functionsPackageJsonPath,
        JSON.stringify(functionsPkg, null, 2) + '\n'
      );
      console.log(`\n✅ Aggiunte ${added} dipendenze a functions/package.json`);
      console.log('\n⚠️  IMPORTANTE: Esegui "cd functions && npm install" prima del deploy!');
    } else {
      console.log('✅ Tutte le dipendenze sono già presenti in functions/package.json');
    }
  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento di package.json:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    const dependencies = await analyzeDependencies();
    await addToFunctionsPackageJson(dependencies);
    // Ora copiamo comunque i node_modules per l'emulatore locale
    await copyNodeModules(dependencies);
  } catch (error) {
    console.error('❌ Errore:', error);
    process.exit(1);
  }
}

main();