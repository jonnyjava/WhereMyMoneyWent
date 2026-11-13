// Verifies that every repository path mentioned in a workflow, script, config,
// doc or source file actually exists. Moving or renaming a file otherwise
// breaks references silently: linters check syntax, not whether a path exists.
//
// Skipped on purpose:
//   - tokens with placeholders (<name>, $VAR, {x}), which are templates
//   - lines containing "refs:ignore" (used for paths a test creates on the fly)
//   - files that hold patterns instead of references (the protected-paths list,
//     CODEOWNERS, the dependency-cruiser config)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'test-results', 'playwright-report', '.vercel']);
const SKIP_FILES = new Set(['pnpm-lock.yaml', 'protected-paths.txt', 'CODEOWNERS', '.dependency-cruiser.cjs']);
const SCANNED = /\.(md|sh|mjs|cjs|ts|tsx|yml|yaml|json)$/;
// A refuse-to-pass-vacuously guard: finding almost nothing means the scan is broken.
const MIN_REFERENCES = 20;
// Files that a person creates in a project built from this starter, so the starter itself cannot contain them.
const USER_CREATED = new Set(['plan/features.md', 'plan/features.json', 'plan/plan.json']);

const ROOT_DIRS = '(?:\\.github|agents|harness|scripts|docs|src|e2e|drizzle|plan)';
const ROOT_FILES =
  '(?:AGENTS\\.md|CLAUDE\\.md|README\\.md|package\\.json|tsconfig\\.json|\\.nvmrc|\\.env\\.example|' +
  'pnpm-workspace\\.yaml|eslint\\.config\\.mjs|vitest\\.config\\.ts|drizzle\\.config\\.ts|' +
  'playwright(?:\\.postdeploy)?\\.config\\.ts|docker-compose\\.yml|next\\.config\\.ts)';
// "base/" and "head/" are the checkout folders the guard job reads from.
const TOKEN = new RegExp(
  `(?<![\\w./@-])(?:(?:base|head)/)?(${ROOT_DIRS}/[\\w./*\\[\\]<>$@{}-]*|${ROOT_FILES}(?![\\w-]))`,
  'g',
);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (!SKIP_DIRS.has(name) && !(dir === 'drizzle' && name === 'meta')) walk(path, out);
    } else if (SCANNED.test(name) && !SKIP_FILES.has(name)) {
      out.push(path.replace(/^\.\//, ''));
    }
  }
  return out;
}

// Does a glob such as "docs/conventions/*.md" match at least one existing entry?
function globMatches(segments, base) {
  if (segments.length === 0) return true;
  const [head, ...rest] = segments;
  if (head === '**') {
    // zero folders: continue with the rest here; or descend into any subfolder and keep "**"
    if (globMatches(rest, base)) return true;
    let subdirs;
    try {
      subdirs = readdirSync(base || '.').filter((e) => statSync(join(base, e)).isDirectory());
    } catch {
      return false;
    }
    return subdirs.some((dir) => globMatches(segments, join(base, dir)));
  }
  if (!head.includes('*')) {
    const next = join(base, head);
    return existsSync(next) && globMatches(rest, next);
  }
  const pattern = new RegExp('^' + head.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$');
  let entries;
  try {
    entries = readdirSync(base || '.');
  } catch {
    return false;
  }
  return entries.some((entry) => pattern.test(entry) && globMatches(rest, join(base, entry)));
}

function exists(token) {
  const clean = token.replace(/\/+$/, '');
  return clean.includes('*') ? globMatches(clean.split('/'), '') : existsSync(clean);
}

const problems = [];
let checked = 0;
const files = walk('.');

for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((raw, index) => {
    if (raw.includes('refs:ignore')) return;
    const line = raw.replace(/(^|[\s'"(=:`])\.\//g, '$1'); // strips a leading "./" refs:ignore
    for (const match of line.matchAll(TOKEN)) {
      const token = match[1].replace(/[.,:;]+$/, '');
      if (/[<>${}]/.test(token)) continue; // a template, not a real path
      if (USER_CREATED.has(token)) continue;
      checked += 1;
      if (!exists(token)) problems.push(`${file}:${index + 1}: "${token}" does not exist`);
    }
  });
}

if (checked < MIN_REFERENCES) {
  console.error(
    `Only ${checked} path references were found in ${files.length} files. ` +
      'The reference check would pass while checking almost nothing.',
  );
  process.exit(1);
}
if (problems.length > 0) {
  console.error('Broken path references (a file was moved or renamed without updating them):');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`references ok (${checked} paths in ${files.length} files)`);
