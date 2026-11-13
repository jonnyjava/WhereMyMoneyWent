// Runs the real sync tool against a stub `gh` that records every call and keeps issues in a JSON file.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../..', import.meta.url));
const FAKE_GH = `#!/usr/bin/env node
const fs = require('node:fs');
const file = process.env.FAKE_GH_STATE;
const state = JSON.parse(fs.readFileSync(file, 'utf8'));
const args = process.argv.slice(2);
state.calls.push(args.join(' '));
const save = () => fs.writeFileSync(file, JSON.stringify(state));
const all = (name) => args.flatMap((a, i) => (a === name ? [args[i + 1]] : []));
const [cmd, sub] = args;
if (cmd === 'issue' && sub === 'list') {
  save();
  console.log(JSON.stringify(state.issues.map((i) => ({ number: i.number, state: i.state, labels: i.labels.map((name) => ({ name })), body: i.body, title: i.title }))));
} else if (cmd === 'issue' && sub === 'create') {
  const body = fs.readFileSync(0, 'utf8');
  const number = state.issues.length + 1;
  state.issues.push({ number, state: 'OPEN', labels: all('--label'), body, title: all('--title')[0] });
  save();
  console.log('https://github.com/o/r/issues/' + number);
} else if (cmd === 'issue' && sub === 'edit') {
  const issue = state.issues.find((i) => i.number === Number(args[2]));
  for (const l of all('--add-label')) if (!issue.labels.includes(l)) issue.labels.push(l);
  for (const l of all('--remove-label')) issue.labels = issue.labels.filter((x) => x !== l);
  save();
} else if (cmd === 'label' && sub === 'create') {
  const exists = state.labels.includes(args[2]);
  if (!exists) state.labels.push(args[2]);
  save();
  process.exit(exists ? 1 : 0);
} else if (cmd === 'workflow' && sub === 'run') {
  save();
} else {
  save();
  console.error('stub gh: unsupported command: ' + args.join(' '));
  process.exit(2);
}
`;

let dir;
const stateFile = () => join(dir, 'state.json');
const state = () => JSON.parse(readFileSync(stateFile(), 'utf8'));
const MUTATING = /^(issue create|issue edit|label create|workflow run)/;

function makeProject({ contexts = ['catalog', 'circulation'], mutate } = {}) {
  if (dir) rmSync(dir, { recursive: true, force: true }); // a test may call this again: do not orphan the folder beforeEach made
  dir = mkdtempSync(join(tmpdir(), 'plan-sync-'));
  mkdirSync(join(dir, 'bin'));
  // The stub is CommonJS. If TMPDIR sits inside the project, the nearest package.json would make it an ES module.
  writeFileSync(join(dir, 'bin/package.json'), '{"type":"commonjs"}\n');
  writeFileSync(join(dir, 'bin/gh'), FAKE_GH);
  chmodSync(join(dir, 'bin/gh'), 0o755);
  writeFileSync(stateFile(), JSON.stringify({ issues: [], labels: [], calls: [] }));
  mkdirSync(join(dir, 'plan'));
  const plan = JSON.parse(readFileSync(join(repo, 'plan/plan.example.json'), 'utf8'));
  if (mutate) mutate(plan);
  writeFileSync(join(dir, 'plan/plan.json'), JSON.stringify(plan));
  for (const c of contexts) {
    mkdirSync(join(dir, 'src/contexts', c), { recursive: true });
    writeFileSync(join(dir, 'src/contexts', c, 'index.ts'), 'export {};\n');
  }
}

function sync(...extra) {
  const env = { ...process.env, PATH: `${join(dir, 'bin')}:${process.env.PATH}`, FAKE_GH_STATE: stateFile() };
  try {
    const out = execFileSync('node', ['scripts/plan/sync-issues.mjs', '--root', dir, ...extra], { cwd: repo, env, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status, out: `${e.stdout}${e.stderr}` };
  }
}
const mutatingCalls = () => state().calls.filter((c) => MUTATING.test(c));
const labelsOf = (n) => state().issues.find((i) => i.number === n).labels;

beforeEach(() => makeProject());
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('sync-issues', () => {
  it('creates every issue in dependency order, links dependencies, and releases only what may start', () => {
    const r = sync('--apply');
    assert.equal(r.code, 0, r.out);
    const s = state();
    assert.deepEqual(s.issues.map((i) => i.title.slice(0, 7)), ['[T-001]', '[T-002]', '[T-003]', '[T-004]', '[T-005]']);
    assert.match(s.issues[3].body, /## Depends on\n- #3 \(T-003\)/);
    assert.match(s.issues[0].body, /^<!-- plan-task:T-001 -->/);
    assert.deepEqual(labelsOf(1), ['plan-task', 'ctx:catalog', 'ready']);
    assert.deepEqual(labelsOf(2), ['plan-task', 'blocked', 'ctx:catalog']);
    assert.ok(s.calls.includes('workflow run coding-agent.yml -f mode=implement -f issue=1'));
    assert.equal(s.calls.filter((c) => c.startsWith('workflow run')).length, 1);
  });

  it('is safe to run again: nothing is created or released twice', () => {
    sync('--apply');
    const before = JSON.stringify(state().issues);
    const runsBefore = state().calls.filter((c) => c.startsWith('workflow run')).length;
    const r = sync('--apply');
    assert.equal(r.code, 0, r.out);
    assert.equal(JSON.stringify(state().issues), before);
    assert.equal(state().calls.filter((c) => c.startsWith('workflow run')).length, runsBefore);
    assert.match(r.out, /0 issue\(s\) created, 0 released/);
  });

  it('releases the next tasks when a dependency closes, up to max_parallel', () => {
    sync('--apply');
    const s = state();
    s.issues[0].state = 'CLOSED';
    writeFileSync(stateFile(), JSON.stringify(s));
    const r = sync('--apply');
    assert.equal(r.code, 0, r.out);
    assert.ok(labelsOf(2).includes('ready') && labelsOf(3).includes('ready'));
    assert.ok(!labelsOf(2).includes('blocked'));
    assert.ok(labelsOf(4).includes('blocked'), 'T-004 still waits for T-003');
    const runs = state().calls.filter((c) => c.startsWith('workflow run'));
    assert.ok(runs.includes('workflow run coding-agent.yml -f mode=implement -f issue=2'));
    assert.ok(runs.includes('workflow run coding-agent.yml -f mode=implement -f issue=3'));
  });

  it('holds tasks back when max_parallel is 1', () => {
    makeProject({ mutate: (p) => { p.policy.max_parallel = 1; } });
    sync('--apply');
    const s = state();
    s.issues[0].state = 'CLOSED';
    writeFileSync(stateFile(), JSON.stringify(s));
    const r = sync('--apply');
    assert.ok(labelsOf(2).includes('ready'));
    assert.ok(!labelsOf(3).includes('ready'));
    assert.match(r.out, /waiting T-003: all 1 slots are busy/);
  });

  it('creates the issues but releases none while the contexts do not exist yet', () => {
    makeProject({ contexts: [] });
    const r = sync('--apply');
    assert.equal(r.code, 0, r.out);
    assert.equal(state().issues.length, 5);
    assert.equal(state().calls.filter((c) => c.startsWith('workflow run')).length, 0);
    assert.match(r.out, /waiting T-001: context catalog does not exist yet/);
  });

  it('a dry run reads GitHub but changes nothing', () => {
    const r = sync();
    assert.equal(r.code, 0, r.out);
    assert.deepEqual(mutatingCalls(), []);
    assert.match(r.out, /would create \[T-001\]/);
    assert.match(r.out, /would release T-001/);
    assert.match(r.out, /\(dry run\) 5 issue\(s\) to create, 1 to release/);
  });

  it('refuses an invalid plan and changes nothing', () => {
    makeProject({ mutate: (p) => { p.tasks[0].criteria = ['The list works well.']; } });
    const r = sync('--apply');
    assert.equal(r.code, 1);
    assert.match(r.out, /The plan is not valid, so nothing was changed/);
    assert.deepEqual(state().calls, []);
  });

  it('leaves a task alone that a person marked needs-human', () => {
    sync('--apply');
    const s = state();
    s.issues[0].state = 'CLOSED';
    s.issues[1].labels.push('needs-human');
    writeFileSync(stateFile(), JSON.stringify(s));
    sync('--apply');
    assert.ok(!labelsOf(2).includes('ready'));
    assert.ok(labelsOf(3).includes('ready'));
  });

  it('exits quietly when there is no plan', () => {
    rmSync(join(dir, 'plan/plan.json'));
    const r = sync('--apply');
    assert.equal(r.code, 0);
    assert.match(r.out, /no plan to sync/);
  });
});
