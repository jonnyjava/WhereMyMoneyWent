// File naming rules for src/contexts (see docs/conventions/naming.md).
// Files are kebab-case and end with a role suffix that matches their layer.
import { readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = 'src/contexts';
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const LAYER_SUFFIXES = {
  domain: ['aggregate', 'entity', 'value-object', 'event', 'error', 'repository', 'port'],
  application: ['command', 'query', 'handler', 'event-handler', 'dto', 'error', 'port'],
  infrastructure: ['model', 'mapper', 'repository', 'error'],
  testing: ['repository'],
};
// Folder-specific restrictions inside a layer.
const FOLDER_SUFFIXES = {
  commands: ['command', 'handler', 'error'],
  queries: ['query', 'handler', 'dto'],
  'event-handlers': ['event-handler'],
  events: ['event'],
};

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

const problems = [];
const files = walk(ROOT);

for (const file of files) {
  const parts = file.split('/'); // src, contexts, <context>, <layer or file>, ...
  const layer = parts[3];
  const name = basename(file);

  if (parts.length === 4) {
    if (name !== 'index.ts') problems.push(`${file}: only index.ts may sit at the root of a context`);
    continue;
  }
  if (!(layer in LAYER_SUFFIXES)) {
    problems.push(`${file}: unknown layer "${layer}" (expected domain, application, infrastructure or testing)`);
    continue;
  }

  // "order.aggregate.test.ts" -> "order.aggregate"
  const stem = name.replace(/\.tsx?$/, '').replace(/\.test$/, '');
  const dot = stem.lastIndexOf('.');
  if (dot === -1) {
    problems.push(`${file}: needs a role suffix, e.g. "${stem}.${LAYER_SUFFIXES[layer][0]}.ts"`);
    continue;
  }
  const base = stem.slice(0, dot);
  const suffix = stem.slice(dot + 1);

  if (!KEBAB.test(base)) problems.push(`${file}: "${base}" must be kebab-case`);

  let allowed = LAYER_SUFFIXES[layer];
  const folder = parts.slice(4, -1).find((seg) => seg in FOLDER_SUFFIXES);
  if (folder) allowed = allowed.filter((s) => FOLDER_SUFFIXES[folder].includes(s));
  if (!allowed.includes(suffix)) {
    problems.push(`${file}: suffix ".${suffix}" is not allowed in ${layer}/${folder ? folder + '/' : ''} (allowed: ${allowed.join(', ')})`);
  }
}

// kebab-case for the other source folders too. Next.js special files (page, layout, route, ...) are single words, so they pass.
for (const dir of ['src/shared', 'src/composition', 'src/ui', 'src/app']) {
  let list;
  try {
    list = walk(dir);
  } catch {
    continue; // folder does not exist yet
  }
  for (const file of list) {
    const base = basename(file).replace(/\.tsx?$/, '').replace(/\.test$/, '').replace(/\.client$/, '');
    if (!KEBAB.test(base)) problems.push(`${file}: "${base}" must be kebab-case`);
  }
}

if (problems.length > 0) {
  console.error('File naming violations (see docs/conventions/naming.md):');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`file names ok (${files.length} files under ${ROOT})`);
