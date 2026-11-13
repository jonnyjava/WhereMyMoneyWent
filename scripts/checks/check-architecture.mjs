// Runs dependency-cruiser and FAILS if it did not actually examine the code.
// A tool that silently cruises 0 modules (e.g. an unsupported TypeScript
// version) reports "no violations" while checking nothing.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const CONFIG = '.dependency-cruiser.cjs';
// Every rule the project requires, all as errors. A config with fewer rules, or none, would pass this check while
// enforcing nothing. Adding a rule to the config means adding its name here; this file is a protected path.
const REQUIRED_RULES = [
  'no-circular',
  'domain-is-pure',
  'application-depends-on-domain-only',
  'application-tests-use-fakes',
  'infrastructure-implements-ports',
  'testing-fakes-depend-on-inner-layers',
  'contexts-use-each-others-public-api-only',
  'product-contexts-do-not-depend-on-reference-contexts',
  'shared-kernel-is-independent',
  'delivery-uses-public-api-only',
  'only-composition-imports-infrastructure',
  'production-never-imports-testing',
  'orm-only-in-infrastructure-and-composition',
  'framework-only-in-app-and-composition',
  'ui-kit-is-presentational',
  'client-islands-do-not-reach-the-backend',
  'client-islands-import-contexts-as-types-only',
  'backend-never-imports-ui',
  'no-test-libraries-in-production',
];

if (!existsSync(CONFIG)) {
  console.error(
    `${CONFIG} is missing. Do NOT create one with "depcruise --init": a default config has none of this project's rules, ` +
      'and the check would pass while enforcing nothing. Restore the file from the starter. Names that start with a dot are ' +
      'skipped by "cp -r dir/*" and by some file pickers: copy with "cp -a" or "rsync -a", or unzip the archive, then run "pnpm check:files".',
  );
  process.exit(1);
}
const rules = new Map((createRequire(import.meta.url)(resolve(CONFIG)).forbidden ?? []).map((r) => [r.name, r]));
const weak = [];
for (const name of REQUIRED_RULES) {
  const rule = rules.get(name);
  if (!rule) weak.push(`missing the rule "${name}"`);
  else if (rule.severity !== 'error') weak.push(`the rule "${name}" has severity "${rule.severity}"; it must be "error"`);
}
if (weak.length > 0) {
  console.error(`${CONFIG} does not hold the rules this project requires:`);
  for (const w of weak) console.error(`  - ${w}`);
  console.error('Restore the file from the starter; do not rebuild it from memory.');
  process.exit(1);
}

const base = ['exec', 'depcruise', 'src', '--config', CONFIG];
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
