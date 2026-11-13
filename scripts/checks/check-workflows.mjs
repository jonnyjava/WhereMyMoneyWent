// Workflow hygiene that actionlint does not enforce (see docs/conventions/dependencies.md and harness/pipeline.md).
//   1. every action is pinned to a full commit SHA and names its version in a comment
//   2. no pull_request_target trigger (it runs with secrets on code from forks)
//   3. every workflow declares its permissions at the top, and none grants write-all
//   4. no untrusted text (titles, bodies, branch names, inputs) is placed directly in a shell script
// Refuses to pass when it finds almost nothing to check.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const MIN_WORKFLOWS = 3;
const PINNED = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;
const UNTRUSTED = [
  /github\.event\.issue\.(title|body)/,
  /github\.event\.pull_request\.(title|body|head\.ref|head\.label|head\.repo\.default_branch)/,
  /github\.event\.comment\.body/,
  /github\.event\.review(_comment)?\.body/,
  /github\.event\.head_commit\.(message|author\.(name|email))/,
  /github\.event\.commits/,
  /github\.event\.workflow_run\.(head_branch|head_commit)/,
  /github\.event\.pages/,
  /github\.head_ref/,
  /github\.event\.inputs\./,
  /\binputs\./,
];

function listFiles() {
  const out = [];
  if (existsSync('.github/workflows')) {
    for (const f of readdirSync('.github/workflows')) if (/\.ya?ml$/.test(f)) out.push(join('.github/workflows', f));
  }
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/^action\.ya?ml$/.test(name)) out.push(p);
    }
  };
  if (existsSync('.github/actions')) walk('.github/actions');
  return out;
}

const files = listFiles();
const workflows = files.filter((f) => f.startsWith('.github/workflows/'));
if (workflows.length < MIN_WORKFLOWS) {
  console.error(`Found ${workflows.length} workflow file(s) under .github/workflows: the workflow check would pass while checking nothing.`);
  process.exit(1);
}

const problems = [];
let actionRefs = 0;
for (const file of files) {
  const text = readFileSync(file, 'utf8');

  // 1. pinned actions
  text.split('\n').forEach((line, i) => {
    const m = /^\s*(?:-\s+)?uses:\s*([^\s#]+)\s*(#.*)?$/.exec(line);
    if (!m) return;
    const ref = m[1].replace(/^['"]|['"]$/g, '');
    if (ref.startsWith('./')) return; // a local action
    actionRefs += 1;
    const where = `${file}:${i + 1}`;
    if (ref.startsWith('docker://')) problems.push(`${where}: "${ref}" is a container image, which has a mutable tag; use a pinned action`);
    else if (!PINNED.test(ref)) problems.push(`${where}: "${ref}" is not pinned to a full commit SHA: a tag can be moved by whoever controls the repository`);
    else if (!/^#\s*v\d+(\.\d+){0,2}/.test(m[2] ?? '')) problems.push(`${where}: a pinned action needs a "# v1.2.3" comment naming its version`);
  });

  let doc;
  try {
    doc = YAML.parse(text);
  } catch (e) {
    problems.push(`${file}: not valid YAML (${e.message.split('\n')[0]})`);
    continue;
  }
  if (!file.startsWith('.github/workflows/')) continue;

  // 2. triggers
  const triggers = doc.on ?? doc.true;
  const names = typeof triggers === 'string' ? [triggers] : Array.isArray(triggers) ? triggers : Object.keys(triggers ?? {});
  if (names.includes('pull_request_target')) problems.push(`${file}: uses the pull_request_target trigger, which runs with secrets on code from forks`);

  // 3. permissions
  if (doc.permissions === undefined) problems.push(`${file}: declare "permissions:" at the top (start from contents: read), so jobs do not inherit broad defaults`);
  if (doc.permissions === 'write-all' || Object.values(doc.jobs ?? {}).some((j) => j.permissions === 'write-all')) {
    problems.push(`${file}: "permissions: write-all" is not allowed; list the permissions a job needs`);
  }

  // 4. untrusted text in shell scripts
  for (const [jobName, job] of Object.entries(doc.jobs ?? {})) {
    for (const step of job.steps ?? []) {
      if (typeof step.run !== 'string') continue;
      for (const m of step.run.matchAll(/\$\{\{([^}]*)\}\}/g)) {
        if (UNTRUSTED.some((re) => re.test(m[1]))) {
          problems.push(`${file}: job "${jobName}", step "${step.name ?? step.id ?? 'unnamed'}" puts "${m[1].trim()}" directly in a shell script; pass it through env instead`);
        }
      }
    }
  }
}

if (problems.length > 0) {
  console.error('Workflow problems (see docs/conventions/dependencies.md):');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`workflows ok (${workflows.length} workflows, ${actionRefs} action references, all pinned)`);
