const path = require('path');
const fs = require('fs/promises');

function toCamel(input) {
  return input
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part, idx) => {
      const lower = part.toLowerCase();
      if (idx === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

function toPascal(input) {
  const camel = toCamel(input);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function titleFromSnake(input) {
  return input
    .split(/[_-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function lowerFirst(input) {
  if (!input) return input;
  return input.charAt(0).toLowerCase() + input.slice(1);
}

function replaceAll(content, replacements) {
  let output = content;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(key).join(value);
  }
  return output;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const positional = args.filter(arg => !arg.startsWith('--'));
  const entitaSnake = positional[0];
  const entityPascal = positional[1];

  if (!entitaSnake || !entityPascal) {
    console.log('Usage: node scripts/generate-entity-template.cjs <entita_plural> <EntityName> [--force] [--dry-run]');
    process.exit(1);
  }

  const entitaCamel = toCamel(entitaSnake);
  const entitaPascal = toPascal(entitaSnake);
  const entitaConst = entitaSnake.toUpperCase();
  const entityCamel = lowerFirst(entityPascal);
  const entityLabel = entityPascal.replace(/([a-z])([A-Z])/g, '$1 $2');
  const entitaLabelPlural = titleFromSnake(entitaSnake);

  const replacements = {
    '__ENTITY_PASCAL__': entityPascal,
    '__ENTITY_CAMEL__': entityCamel,
    '__ENTITA_SNAKE__': entitaSnake,
    '__ENTITA_CONST__': entitaConst,
    '__ENTITA_PASCAL__': entitaPascal,
    '__ENTITA_CAMEL__': entitaCamel,
    '__ENTITY_LABEL__': entityLabel,
    '__ENTITA_LABEL_PLURAL__': entitaLabelPlural
  };

  const templateRoot = path.resolve(__dirname, '..', 'templates');
  const targets = [
    {
      src: path.join(templateRoot, 'entity.api.template.js'),
      dest: path.resolve(__dirname, '..', 'functions', 'api', `${entitaSnake}.js`)
    },
    {
      src: path.join(templateRoot, 'entity.test.template.js'),
      dest: path.resolve(__dirname, '..', 'tests', 'functions', `${entitaSnake}.test.js`)
    },
    {
      src: path.join(templateRoot, 'entity.page.template.astro'),
      dest: path.resolve(__dirname, '..', 'src', 'pages', `${entitaSnake}.astro`)
    },
    {
      src: path.join(templateRoot, 'entity.script.template.js'),
      dest: path.resolve(__dirname, '..', 'src', 'scripts', `${entitaSnake}.js`)
    },
    {
      src: path.join(templateRoot, 'entity.store.template.js'),
      dest: path.resolve(__dirname, '..', 'src', 'stores', `${entitaCamel}Store.js`)
    }
  ];

  const written = [];

  for (const target of targets) {
    const exists = await fileExists(target.dest);
    if (exists && !force) {
      console.log(`Skip (exists): ${path.relative(process.cwd(), target.dest)}`);
      continue;
    }

    const content = await fs.readFile(target.src, 'utf8');
    const output = replaceAll(content, replacements);
    if (dryRun) {
      console.log(`Dry-run: ${path.relative(process.cwd(), target.dest)}`);
      continue;
    }

    await fs.mkdir(path.dirname(target.dest), { recursive: true });
    await fs.writeFile(target.dest, output, 'utf8');
    written.push(path.relative(process.cwd(), target.dest));
  }

  if (dryRun) {
    console.log('Dry-run complete.');
    return;
  }

  if (written.length === 0) {
    console.log('Nessun file creato.');
    return;
  }

  console.log('Creati:');
  written.forEach(file => console.log(`- ${file}`));
  console.log('Ricordati di aggiornare: shared/schemas/entityFactory.js e firestore.rules.');
}

main().catch((error) => {
  console.error('Errore:', error);
  process.exit(1);
});
