// Runs dependency-cruiser and FAILS if it did not actually examine the code.
// A tool that silently cruises 0 modules (e.g. an unsupported TypeScript
// version) reports "no violations" while checking nothing.
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = ['exec', 'depcruise', 'src', '--config', '.dependency-cruiser.cjs'];
const run = (extra) => spawnSync('pnpm', [...base, ...extra], { encoding: 'utf8', maxBuffer: 1 << 28 });

function countSources(dir) {
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) n += countSources(p);
    else if (/\.tsx?$/.test(name) && !name.endsWith('.d.ts')) n += 1;
  }
  return n;
}

const json = run(['--output-type', 'json']);
let summary;
try {
  summary = JSON.parse(json.stdout).summary;
} catch {
  console.error('Could not read dependency-cruiser output:\n' + json.stdout + json.stderr);
  process.exit(1);
}

const sources = countSources('src');
if (summary.totalCruised < sources) {
  console.error(
    `dependency-cruiser examined ${summary.totalCruised} modules but src/ has ${sources} source files. ` +
      'The architecture check would pass while checking nothing. ' +
      'Check that the installed TypeScript version is supported by dependency-cruiser.',
  );
  process.exit(1);
}

const report = run(['--output-type', 'err']);
process.stdout.write(report.stdout);
process.stderr.write(report.stderr);
if (summary.error > 0 || report.status !== 0) process.exit(1);
console.log(`architecture ok (${summary.totalCruised} modules, ${sources} source files)`);
