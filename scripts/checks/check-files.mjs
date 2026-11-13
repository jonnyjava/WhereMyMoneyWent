// Fails with a plain explanation when hidden files are missing (names that start with a dot).
// `cp -r dir/*`, some file pickers and some upload tools skip them without a word, and the first symptom is then a
// confusing error from another tool (for example "Can't open config file '.dependency-cruiser.cjs'").
import { existsSync, readFileSync } from 'node:fs';

const REQUIRED = [
  ['.dependency-cruiser.cjs', 'the architecture rules'],
  ['.nvmrc', 'the Node version'],
  ['.gitignore', 'what must never be committed (env files, build output)'],
  ['.env.example', 'the template of environment variables'],
  ['.github/CODEOWNERS', 'who must review protected paths'],
  ['.github/dependabot.yml', 'dependency update pull requests'],
  ['.github/actions/setup/action.yml', 'the setup step shared by every workflow'],
  ['.github/ISSUE_TEMPLATE/task.md', 'the task template'],
  ...['ci', 'pr-pipeline', 'coding-agent', 'digest', 'plan', 'plan-sync', 'security'].map((w) => [`.github/workflows/${w}.yml`, 'a harness workflow']),
];

// The Node version the project declares. An older Node fails in confusing ways elsewhere (for example,
// "node --test" cannot expand a glob before Node 21).
let failed = false;
const wanted = /(\d+)/.exec(JSON.parse(readFileSync('package.json', 'utf8')).engines?.node ?? '')?.[1];
if (wanted && Number(process.versions.node.split('.')[0]) < Number(wanted)) {
  console.error(
    `Node ${wanted} or newer is required (package.json "engines"), but this is Node ${process.versions.node}. ` +
      `Run "nvm use" (the version is in .nvmrc) or install Node ${wanted}.`,
  );
  failed = true;
}

const missing = REQUIRED.filter(([path]) => !existsSync(path));
if (missing.length > 0) {
  failed = true;
  console.error('Hidden files are missing (names that start with a dot):');
  for (const [path, why] of missing) console.error(`  - ${path}: ${why}`);
  console.error(
    'They were probably skipped when the project was copied: "cp -r dir/*", some file pickers and some upload tools skip them.\n' +
      'Copy with "cp -a" or "rsync -a", or unzip the archive. Do not recreate these files from memory or with a tool\'s "init" command: they hold rules.',
  );
}
if (failed) process.exit(1);
console.log(`files ok (${REQUIRED.length} hidden files present)`);
