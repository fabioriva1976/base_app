import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function toCamel(input: string): string {
  return input
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part: string, idx: number) => {
      const lower = part.toLowerCase();
      if (idx === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

function toPascal(input: string): string {
  const camel = toCamel(input);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function titleFromSnake(input: string): string {
  return input
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function lowerFirst(input: string): string {
  if (!input) return input;
  return input.charAt(0).toLowerCase() + input.slice(1);
}

function replaceAll(content: string, replacements: Record<string, string>): string {
  let output = content;
  for (const [key, value] of Object.entries(replacements)) {
    output = output.split(key).join(value);
  }
  return output;
}

async function fileExists(filePath: string): Promise<boolean> {
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
    console.log('Usage: node scripts/generate-entity-template.ts <entita_plural> <EntityName> [--force] [--dry-run]');
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
      src: path.join(templateRoot, 'entity.api.template.ts'),
      dest: path.resolve(__dirname, '..', 'functions', 'api', `${entitaSnake}.ts`)
    },
    {
      src: path.join(templateRoot, 'entity.test.template.ts'),
      dest: path.resolve(__dirname, '..', 'tests', 'functions', `${entitaSnake}.test.js`)
    },
    {
      src: path.join(templateRoot, 'entity.page.template.astro'),
      dest: path.resolve(__dirname, '..', 'src', 'pages', `${entitaSnake}.astro`)
    },
    {
      src: path.join(templateRoot, 'entity.script.template.ts'),
      dest: path.resolve(__dirname, '..', 'src', 'scripts', `${entitaSnake}.ts`)
    },
    {
      src: path.join(templateRoot, 'entity.store.template.ts'),
      dest: path.resolve(__dirname, '..', 'src', 'stores', `${entitaCamel}Store.ts`)
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
  console.log('Ricordati di aggiornare: shared/schemas/entityFactory.ts e firestore.rules.');
}

main().catch((error) => {
  console.error('Errore:', error);
  process.exit(1);
});
