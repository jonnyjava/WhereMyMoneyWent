// Checks the planning files: the feature file (if present) and the plan (if present).
// Usage: node scripts/plan/check-plan.mjs [--plan <file>] [--features <file>] [--root <dir>]
// With no options it checks plan/features.md|json and plan/plan.json when they exist.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readFeatureFile, validatePlan } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const root = opt('--root') ?? '.';
const planPath = opt('--plan') ?? join(root, 'plan/plan.json');
const contextExists = (name) => existsSync(join(root, 'src/contexts', name, 'index.ts'));

const errors = [];
const warnings = [];
let features = null;

let featuresPath = opt('--features');
if (!featuresPath) {
  featuresPath = ['plan/features.md', 'plan/features.json'].map((p) => join(root, p)).find((p) => existsSync(p));
}
let plan = null;
if (existsSync(planPath)) {
  try {
    plan = JSON.parse(readFileSync(planPath, 'utf8'));
  } catch (e) {
    errors.push(`${planPath}: not valid JSON (${e.message})`);
  }
  if (!featuresPath && plan && plan.source && existsSync(join(root, plan.source))) featuresPath = join(root, plan.source);
}
if (featuresPath) {
  const read = readFeatureFile(featuresPath);
  for (const e of read.errors) errors.push(`${featuresPath}: ${e}`);
  if (read.errors.length === 0) features = read.model;
}
if (plan) {
  const result = validatePlan(plan, { features, contextExists });
  errors.push(...result.errors);
  warnings.push(...result.warnings);
}

for (const w of warnings) console.log(`warning: ${w}`);
if (errors.length > 0) {
  console.error('Planning problems:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
if (!plan && !features) {
  console.log('no plan to check (no plan/features.* or plan/plan.json yet)');
} else {
  const parts = [];
  if (features) parts.push(`${features.features.length} features`);
  if (plan) parts.push(`${plan.tasks.length} tasks, ${plan.contexts.length} contexts`);
  console.log(`plan ok (${parts.join('; ')}; ${warnings.length} warnings)`);
}
