// Makes GitHub issues match the approved plan, then releases the tasks that may start.
//   1. create the issue of every task that has none (in dependency order)
//   2. release tasks: label ready + start the coding agent, when the rules in decide.mjs allow it
// Safe to run any number of times. Without --apply it only prints what it would do.
// Usage: node scripts/plan/sync-issues.mjs [--plan <file>] [--root <dir>] [--apply] [--no-remote]
//   --no-remote  do not read GitHub; pretend no issues exist (a local preview)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { topoOrder, validatePlan } from './lib.mjs';
import { parseMarker, planRelease, renderIssueBody } from './decide.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const apply = flag('--apply');
const root = opt('--root') ?? '.';
const planPath = opt('--plan') ?? join(root, 'plan/plan.json');

function gh(ghArgs, input) {
  return execFileSync('gh', ghArgs, { encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'inherit'] });
}
function ensureLabel(name, color, description) {
  try {
    gh(['label', 'create', name, '--color', color, '--description', description]);
  } catch {
    // it already exists
  }
}
function listIssues() {
  const out = gh(['issue', 'list', '--label', 'plan-task', '--state', 'all', '--limit', '1000', '--json', 'number,state,labels,body,title']);
  return JSON.parse(out).map((i) => ({
    number: i.number,
    state: String(i.state).toLowerCase(),
    labels: i.labels.map((l) => l.name),
    taskId: parseMarker(i.body),
  }));
}

if (!existsSync(planPath)) {
  console.log(`no plan to sync (${planPath} does not exist)`);
  process.exit(0);
}
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
const contextExists = (name) => existsSync(join(root, 'src/contexts', name, 'index.ts'));
const { errors, warnings } = validatePlan(plan, { contextExists });
if (errors.length > 0) {
  console.error('The plan is not valid, so nothing was changed:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
for (const w of warnings) console.log(`warning: ${w}`);

const issues = flag('--no-remote') ? [] : listIssues();
const numberOf = (taskId) => issues.find((i) => i.taskId === taskId)?.number;

// 1. create missing issues, dependencies first
let created = 0;
if (apply) {
  ensureLabel('plan-task', '0E8A16', 'Task created from the approved plan');
  ensureLabel('blocked', 'BFD4F2', 'Waiting for dependencies, a context, or an answer');
  ensureLabel('ready', '1D76DB', 'Released: the coding agent may start');
}
for (const task of topoOrder(plan.tasks, (t) => t.id, (t) => t.depends_on)) {
  if (numberOf(task.id) !== undefined) continue;
  const depLines = task.depends_on.map((dep) => `- #${numberOf(dep) ?? '?'} (${dep})`);
  const title = `[${task.id}] ${task.title}`;
  const labels = ['plan-task', 'blocked', `ctx:${task.context}`];
  if (apply) {
    ensureLabel(`ctx:${task.context}`, 'C5DEF5', `Bounded context ${task.context}`);
    const createArgs = ['issue', 'create', '--title', title, '--body-file', '-'];
    for (const l of labels) createArgs.push('--label', l);
    const url = gh(createArgs, renderIssueBody(task, depLines)).trim();
    const number = Number(url.split('/').pop());
    issues.push({ number, state: 'open', labels, taskId: task.id });
    console.log(`created #${number} ${title}`);
  } else {
    issues.push({ number: undefined, state: 'open', labels, taskId: task.id });
    console.log(`would create ${title}`);
  }
  created += 1;
}

// 2. release what may start
const { release, waiting, inflight, max } = planRelease({ plan, issues, contextExists });
for (const taskId of release) {
  const issue = issues.find((i) => i.taskId === taskId);
  if (apply) {
    const editArgs = ['issue', 'edit', String(issue.number), '--add-label', 'ready'];
    if (issue.labels.includes('blocked')) editArgs.push('--remove-label', 'blocked');
    gh(editArgs);
    gh(['workflow', 'run', 'coding-agent.yml', '-f', 'mode=implement', '-f', `issue=${issue.number}`]);
    console.log(`released ${taskId} (#${issue.number}): labeled ready, coding agent started`);
  } else {
    console.log(`would release ${taskId}`);
  }
}
for (const w of waiting) console.log(`waiting ${w.task}: ${w.reason}`);
const verb = apply ? ['created', 'released'] : ['to create', 'to release'];
console.log(`${apply ? '' : '(dry run) '}${created} issue(s) ${verb[0]}, ${release.length} ${verb[1]}, ${waiting.length} waiting; ${inflight} in flight before this run, max_parallel ${max}`);
