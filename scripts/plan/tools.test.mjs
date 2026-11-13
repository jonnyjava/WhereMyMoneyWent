// The smaller tools: extract-plan, parse-features, check-plan and new-context.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { scaffoldContext } from './new-context.mjs';

const repo = fileURLToPath(new URL('../..', import.meta.url));
let dir;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'plan-tools-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function run(script, args, options = {}) {
  try {
    const out = execFileSync('node', [`scripts/plan/${script}`, ...args], { cwd: repo, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...options });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: `${e.stdout}${e.stderr}` };
  }
}
const planText = readFileSync(join(repo, 'plan/plan.example.json'), 'utf8');

describe('extract-plan', () => {
  it('finds the plan in an answer that has prose around it, preferring the last valid block', () => {
    const file = join(dir, 'out.md');
    writeFileSync(file, `Here is my thinking.\n\n\`\`\`json\n{"not":"a plan"}\n\`\`\`\n\nFinal answer:\n\n\`\`\`json\n${planText}\n\`\`\`\n`);
    const r = run('extract-plan.mjs', [file]);
    assert.equal(r.code, 0, r.out);
    assert.equal(JSON.parse(r.out).tasks.length, 5);
  });

  it('accepts a closing fence that follows the JSON with no line break', () => {
    const file = join(dir, 'out.md');
    writeFileSync(file, `\`\`\`json\n${planText.trim()}\`\`\``);
    assert.equal(run('extract-plan.mjs', [file]).code, 0);
  });

  it('accepts an answer that is bare JSON', () => {
    const file = join(dir, 'out.json');
    writeFileSync(file, planText);
    assert.equal(run('extract-plan.mjs', [file]).code, 0);
  });

  it('fails clearly when there is no plan', () => {
    const file = join(dir, 'out.md');
    writeFileSync(file, 'I could not produce a plan.');
    const r = run('extract-plan.mjs', [file]);
    assert.equal(r.code, 1);
    assert.match(r.out, /No plan found/);
  });
});

describe('parse-features and check-plan', () => {
  it('parse-features prints the model, and exits 1 with line numbers on a bad file', () => {
    assert.equal(JSON.parse(run('parse-features.mjs', ['plan/features.example.md']).out).features.length, 3);
    const bad = join(dir, 'bad.md');
    writeFileSync(bad, '# P\n\n## F-001 A\nstray words\n');
    const r = run('parse-features.mjs', [bad]);
    assert.equal(r.code, 1);
    assert.match(r.out, /line 4: cannot read "stray words"/);
  });

  it('check-plan passes the example pair and explains a failure', () => {
    const ok = run('check-plan.mjs', ['--plan', 'plan/plan.example.json', '--features', 'plan/features.example.md']);
    assert.equal(ok.code, 0, ok.out);
    assert.match(ok.out, /plan ok \(3 features; 5 tasks, 2 contexts; 0 warnings\)/);
    const broken = JSON.parse(planText);
    broken.tasks[0].criteria = ['It works properly.'];
    const file = join(dir, 'plan.json');
    writeFileSync(file, JSON.stringify(broken));
    const r = run('check-plan.mjs', ['--plan', file, '--features', 'plan/features.example.md']);
    assert.equal(r.code, 1);
    assert.match(r.out, /T-001 criteria\[0\]/);
  });

  it('check-plan says so, and passes, when there is nothing to check yet', () => {
    const r = run('check-plan.mjs', ['--root', dir]);
    assert.equal(r.code, 0);
    assert.match(r.out, /no plan to check/);
  });
});

describe('new-context', () => {
  const docs = () => {
    mkdirSync(join(dir, 'docs'));
    for (const f of ['contexts.md', 'domain-language.md']) copyFileSync(join(repo, 'docs', f), join(dir, 'docs', f));
  };

  it('creates the layer folders and a public index, and registers the context in the docs', () => {
    docs();
    scaffoldContext({ root: dir, name: 'catalog', purpose: 'Which books exist.', terms: [{ term: 'Book', meaning: 'A title the library owns.' }] });
    for (const layer of ['domain', 'application', 'infrastructure', 'testing']) {
      assert.ok(existsSync(join(dir, 'src/contexts/catalog', layer, '.gitkeep')), layer);  // refs:ignore (a path inside a temporary project)
    }
    assert.match(readFileSync(join(dir, 'src/contexts/catalog/index.ts'), 'utf8'), /export \{\};/);  // refs:ignore (a path inside a temporary project)
    const contexts = readFileSync(join(dir, 'docs/contexts.md'), 'utf8');
    assert.match(contexts, /\| `catalog` \| Which books exist\. \| \| \|/);
    assert.ok(!contexts.includes('_none yet_'));
    const language = readFileSync(join(dir, 'docs/domain-language.md'), 'utf8');
    assert.ok(language.indexOf('## `catalog`') < language.indexOf('## Proposed terms'));
    assert.match(language, /- \*\*Book\*\*: A title the library owns\./);
  });

  it('appends a second context instead of replacing the first', () => {
    docs();
    scaffoldContext({ root: dir, name: 'catalog', purpose: 'A.' });
    scaffoldContext({ root: dir, name: 'circulation', purpose: 'B.' });
    const contexts = readFileSync(join(dir, 'docs/contexts.md'), 'utf8');
    assert.ok(contexts.includes('| `catalog` | A.') && contexts.includes('| `circulation` | B.'));
  });

  it('refuses bad names, reference contexts and folders that already exist', () => {
    assert.throws(() => scaffoldContext({ root: dir, name: 'Catalog' }), /kebab-case/);
    assert.throws(() => scaffoldContext({ root: dir, name: 'reference-catalog' }), /reserved for pattern examples/);
    scaffoldContext({ root: dir, name: 'catalog' });
    assert.throws(() => scaffoldContext({ root: dir, name: 'catalog' }), /already exists/);
  });

  it('--from-plan creates every proposed context once, and skips the ones that exist', () => {
    docs();
    mkdirSync(join(dir, 'plan'));
    writeFileSync(join(dir, 'plan/plan.json'), planText);
    const first = run('new-context.mjs', ['--from-plan', '--root', dir]);
    assert.equal(first.code, 0, first.out);
    assert.ok(existsSync(join(dir, 'src/contexts/catalog/index.ts')) && existsSync(join(dir, 'src/contexts/circulation/index.ts')));  // refs:ignore (a path inside a temporary project)
    assert.match(first.out, /2 context\(s\) created/);
    const second = run('new-context.mjs', ['--from-plan', '--root', dir]);
    assert.match(second.out, /skipped catalog: it already exists/);
    assert.match(second.out, /0 context\(s\) created/);
  });
});

describe('wiring', () => {
  const pkg = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));

  it('the plan checks are part of verify:fast, so a broken plan fails every pull request', () => {
    assert.match(pkg.scripts['verify:fast'], /pnpm check:plan/);
    assert.match(pkg.scripts['verify:fast'], /pnpm test:plan/);
  });

  it('agents may not edit planning files', () => {
    assert.match(readFileSync(join(repo, 'harness/protected-paths.txt'), 'utf8'), /^\/plan\/$/m);
  });

  it('every script the planning workflows call exists', () => {
    for (const file of ['plan.yml', 'plan-sync.yml']) {
      const text = readFileSync(join(repo, '.github/workflows', file), 'utf8');
      for (const m of text.matchAll(/scripts\/plan\/[a-z-]+\.mjs/g)) assert.ok(existsSync(join(repo, m[0])), `${file} calls ${m[0]}`);
    }
  });
});
