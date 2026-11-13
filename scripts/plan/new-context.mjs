// Creates the folder structure of a bounded context and registers it in the docs.
// A PERSON runs this (agents must stop and ask before a new context exists).
// Usage:
//   node scripts/plan/new-context.mjs <name> [--purpose "one sentence"]
//   node scripts/plan/new-context.mjs --from-plan [--plan <file>]   (creates every proposed context that is missing)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LAYERS = ['domain', 'application', 'infrastructure', 'testing'];

function updateContextsDoc(root, name, purpose) {
  const file = join(root, 'docs/contexts.md');
  if (!existsSync(file)) return;
  const lines = readFileSync(file, 'utf8').split('\n');
  const row = `| \`${name}\` | ${purpose} | | |`;
  const placeholder = lines.findIndex((l) => l.startsWith('| _none yet_'));
  if (placeholder >= 0) {
    lines[placeholder] = row;
  } else {
    let last = -1;
    lines.forEach((l, i) => {
      if (l.startsWith('|')) last = i;
    });
    lines.splice(last + 1, 0, row);
  }
  writeFileSync(file, lines.join('\n'));
}

function updateLanguageDoc(root, name, purpose, terms) {
  const file = join(root, 'docs/domain-language.md');
  if (!existsSync(file)) return;
  const text = readFileSync(file, 'utf8');
  const section = [`## \`${name}\``, purpose, ...terms.map((t) => `- **${t.term}**: ${t.meaning}`), '', ''].join('\n');
  const anchor = '## Proposed terms';
  const next = text.includes(anchor) ? text.replace(anchor, `${section}${anchor}`) : `${text.trimEnd()}\n\n${section}`;
  writeFileSync(file, next);
}

export function scaffoldContext({ root, name, purpose = 'TODO: describe this context in one sentence.', terms = [] }) {
  if (!KEBAB.test(name)) throw new Error(`"${name}" must be kebab-case`);
  if (name.startsWith('reference-')) throw new Error('names starting with "reference-" are reserved for pattern examples');
  const dir = join(root, 'src/contexts', name);
  if (existsSync(dir)) throw new Error(`src/contexts/${name} already exists`);
  for (const layer of LAYERS) {
    mkdirSync(join(dir, layer), { recursive: true });
    writeFileSync(join(dir, layer, '.gitkeep'), '');
  }
  writeFileSync(
    join(dir, 'index.ts'),
    `// Public API of the "${name}" context.\n// Export only commands, queries, DTOs, error types and event types.\n// Never aggregates, entities, value objects or repositories.\nexport {};\n`,
  );
  updateContextsDoc(root, name, purpose);
  updateLanguageDoc(root, name, purpose, terms);
}

function main() {
  const args = process.argv.slice(2);
  const opt = (n) => {
    const i = args.indexOf(n);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const root = opt('--root') ?? '.';
  try {
    if (args.includes('--from-plan')) {
      const plan = JSON.parse(readFileSync(opt('--plan') ?? join(root, 'plan/plan.json'), 'utf8'));
      let made = 0;
      for (const c of plan.contexts.filter((x) => x.status === 'proposed')) {
        if (existsSync(join(root, 'src/contexts', c.name))) {
          console.log(`skipped ${c.name}: it already exists`);
          continue;
        }
        scaffoldContext({ root, name: c.name, purpose: c.purpose, terms: c.terms ?? [] });
        console.log(`created src/contexts/${c.name}`);
        made += 1;
      }
      console.log(`${made} context(s) created. Review docs/contexts.md and docs/domain-language.md, then commit.`);
    } else {
      const name = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--purpose');
      if (!name) throw new Error('usage: new-context.mjs <name> [--purpose "..."] | --from-plan');
      scaffoldContext({ root, name, purpose: opt('--purpose') });
      console.log(`created src/contexts/${name}. Review docs/contexts.md and docs/domain-language.md, then commit.`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
