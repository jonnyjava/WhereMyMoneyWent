// Reads a feature file (Markdown or JSON), checks it, and prints it as normalized JSON.
// Usage: node scripts/plan/parse-features.mjs <file>
import { readFeatureFile } from './lib.mjs';

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/plan/parse-features.mjs <feature file (.md or .json)>');
  process.exit(2);
}
const { model, errors } = readFeatureFile(file);
if (errors.length > 0) {
  console.error(`Problems in ${file}:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
process.stdout.write(`${JSON.stringify(model, null, 2)}\n`);
