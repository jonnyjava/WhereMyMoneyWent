// UI rules that a linter cannot express (see docs/conventions/ui.md). Scans src/app and src/ui.
//   1. colors come from the design tokens: no raw Tailwind palette, no hard-coded values
//   2. no inline style, no dangerouslySetInnerHTML
//   3. "use client" lives only in *.client.tsx files, and every *.client.tsx starts with it
//   4. "use server" lives only in files named actions.ts
// Test files are not scanned. Refuses to pass if it finds no UI files to check.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['src/app', 'src/ui'];
const SOURCE = /\.tsx?$/;
const TEST = /\.test\.tsx?$/;

const PALETTE =
  '(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';
const COLOR_UTILITY = '(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|accent|caret|shadow|placeholder)';
const RAW_PALETTE = new RegExp(`\\b${COLOR_UTILITY}-${PALETTE}-(?:\\d{2,3}|950)\\b`, 'g');
const RAW_BLACK_WHITE = /\b(?:bg|text|border|ring|fill|stroke)-(?:white|black)\b/g;
const ARBITRARY = /\b[a-z][\w-]*-\[(?:#[0-9a-fA-F]+|[-\d.]+(?:px|rem|em|vh|vw|%)|(?:rgb|hsl|oklch)\([^)]*\))\]/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (SOURCE.test(name) && !TEST.test(name)) out.push(path);
  }
  return out;
}

/** The first directive of a file ("use client" / "use server"), skipping comments and blank lines. */
function firstDirective(text) {
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t === '' || t.startsWith('//') || t.startsWith('/*') || t.startsWith('*')) continue;
    const m = /^(['"])(use client|use server)\1;?$/.exec(t);
    return m ? m[2] : null;
  }
  return null;
}

const files = ROOTS.filter((r) => existsSync(r)).flatMap((r) => walk(r));
if (files.length === 0) {
  console.error('No UI files found under src/app or src/ui: the UI check would pass while checking nothing.');
  process.exit(1);
}

const problems = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const name = file.split('/').pop();
  const lines = text.split('\n');
  lines.forEach((raw, i) => {
    const t = raw.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    const where = `${file}:${i + 1}`;
    for (const m of raw.matchAll(RAW_PALETTE)) problems.push(`${where}: raw Tailwind color "${m[0]}": use a semantic token (bg-surface, text-ink, border-danger, ...) from src/app/globals.css`);
    for (const m of raw.matchAll(RAW_BLACK_WHITE)) problems.push(`${where}: raw Tailwind color "${m[0]}": use a semantic token (text-ink, bg-surface, ...) from src/app/globals.css`);
    for (const m of raw.matchAll(ARBITRARY)) problems.push(`${where}: arbitrary Tailwind value "${m[0]}": use a token or a standard scale value`);
    if (/\bstyle=\{/.test(raw)) problems.push(`${where}: inline style: use Tailwind classes and the design tokens`);
    if (raw.includes('dangerouslySetInnerHTML')) problems.push(`${where}: dangerouslySetInnerHTML is not allowed`);
  });
  const directive = firstDirective(text);
  const isClient = /\.client\.tsx?$/.test(name);
  if (isClient && directive !== 'use client') problems.push(`${file}: a *.client.tsx file must start with the "use client" directive`);
  if (!isClient && directive === 'use client') problems.push(`${file}: has "use client" but is not named *.client.tsx: rename it, so client code is visible from the file name`);
  if (directive === 'use server' && name !== 'actions.ts') problems.push(`${file}: "use server" belongs only in a file named actions.ts`);
}

if (problems.length > 0) {
  console.error('UI problems (see docs/conventions/ui.md):');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`ui ok (${files.length} files)`);
