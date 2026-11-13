// Flags migrations that are not backward compatible. A line starting with
// "NEEDS_HUMAN:" tells the pipeline to escalate instead of starting a fix round.
//
// Default: checks migration files ADDED on this branch (git diff against BASE_REF).
// `--all` checks every file in drizzle/ (useful locally and for tests).
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = 'drizzle';
const all = process.argv.includes('--all');

function candidateFiles() {
  if (all) {
    return readdirSync(DIR).filter((f) => f.endsWith('.sql')).map((f) => `${DIR}/${f}`);
  }
  const base = process.env.BASE_REF ?? 'main';
  const out = execSync(`git diff --name-only --diff-filter=A origin/${base}...HEAD -- ${DIR}`, {
    encoding: 'utf8',
  });
  return out.split('\n').filter((f) => f.endsWith('.sql'));
}

const RULES = [
  [/\bDROP\s+(TABLE|COLUMN|SCHEMA|TYPE|VIEW|INDEX)\b/i, 'drops a database object'],
  [/\bTRUNCATE\b/i, 'truncates a table'],
  [/\bDELETE\s+FROM\b/i, 'deletes rows'],
  [/\bUPDATE\s+\S+\s+SET\b/i, 'rewrites existing rows'],
  [/\bALTER\s+TABLE\b[^;]*\bRENAME\b/i, 'renames a table or column'],
  [/\bALTER\s+COLUMN\b[^;]*\b(SET\s+DATA\s+)?TYPE\b/i, 'changes a column type'],
  [/\bALTER\s+COLUMN\b[^;]*\bSET\s+NOT\s+NULL\b/i, 'makes an existing column NOT NULL'],
];

// An ADD COLUMN that is NOT NULL without a DEFAULT breaks the previous app version's inserts.
const ADD_COLUMN = /\bADD\s+COLUMN\b[^;,]*/gi;

const problems = [];
for (const file of candidateFiles()) {
  // Strip comments, then split drizzle's statement-breakpoint markers.
  const sql = readFileSync(file, 'utf8').replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const statement of sql.split(/-->\s*statement-breakpoint/)) {
    for (const [pattern, reason] of RULES) {
      if (pattern.test(statement)) problems.push(`${file}: ${reason}`);
    }
    for (const m of statement.matchAll(ADD_COLUMN)) {
      if (/\bNOT\s+NULL\b/i.test(m[0]) && !/\bDEFAULT\b/i.test(m[0])) {
        problems.push(`${file}: adds a NOT NULL column without a DEFAULT`);
      }
    }
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error(`NEEDS_HUMAN: ${p}`);
  console.error('Migrations must be backward compatible (see docs/conventions/persistence.md).');
  process.exit(1);
}
console.log('migrations ok');
