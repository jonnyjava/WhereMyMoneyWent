// Pure decisions for the plan-to-issues sync. No GitHub calls here, so every
// rule about WHEN a task may start can be tested directly.

export const DEFAULT_MAX_PARALLEL = 3;

export const marker = (taskId) => `<!-- plan-task:${taskId} -->`;

/** Finds the task id that an issue body carries, or null. */
export function parseMarker(body) {
  const m = /<!-- plan-task:(T-\d{3}) -->/.exec(body ?? '');
  return m ? m[1] : null;
}

/**
 * Renders a task as an issue body in the task-issue format that the coding
 * agent's intake check and the QA gate expect.
 * depLines: the "Depends on" bullet lines, already formatted.
 */
export function renderIssueBody(task, depLines) {
  const lines = [
    marker(task.id),
    '## Goal',
    task.goal,
    '',
    '## Bounded context',
    task.context,
    '',
    '## Acceptance criteria',
    ...task.criteria.map((c) => `- [ ] ${c}`),
    '',
    '## Out of scope',
    ...task.out_of_scope.map((o) => `- ${o}`),
    '',
    '## Open questions',
    ...(task.open_questions.length > 0 ? task.open_questions.map((q) => `- ${q}`) : ['None.']),
    '',
    '## Depends on',
    ...(depLines.length > 0 ? depLines : ['None.']),
    '',
    `Feature ${task.feature}, size ${task.size}. Created from the approved plan; do not edit the marker on the first line.`,
  ];
  return `${lines.join('\n')}\n`;
}

/** Why a task cannot start yet, or null if it can. */
function blockedReason(task, byTask, contextExists) {
  if (task.open_questions.length > 0) return 'has open questions';
  if (!contextExists(task.context)) return `context ${task.context} does not exist yet`;
  const waiting = task.depends_on.filter((dep) => byTask.get(dep)?.state !== 'closed');
  if (waiting.length > 0) return `waiting for ${waiting.join(', ')}`;
  return null;
}

/**
 * Decides which tasks to release (label ready and start the coding agent).
 *
 * issues: [{ number, state: 'open'|'closed', labels: string[], taskId }]
 * A task is released when ALL hold: its issue is open and not yet ready, it has
 * no open questions, its context exists, every dependency's issue is closed,
 * and a slot is free (open issues labeled ready < policy.max_parallel).
 * Tasks are considered in plan order, so the planner's ordering is the priority.
 */
export function planRelease({ plan, issues, contextExists }) {
  const byTask = new Map(issues.filter((i) => i.taskId).map((i) => [i.taskId, i]));
  const max = plan.policy?.max_parallel ?? DEFAULT_MAX_PARALLEL;
  const inflight = issues.filter((i) => i.state === 'open' && i.labels.includes('ready')).length;
  let slots = Math.max(0, max - inflight);
  const release = [];
  const waiting = [];
  for (const task of plan.tasks) {
    const issue = byTask.get(task.id);
    if (!issue) {
      waiting.push({ task: task.id, reason: 'no issue yet' });
      continue;
    }
    if (issue.state !== 'open') continue; // done
    if (issue.labels.includes('ready')) continue; // already released
    if (issue.labels.includes('needs-human')) {
      waiting.push({ task: task.id, reason: 'labeled needs-human' });
      continue;
    }
    const reason = blockedReason(task, byTask, contextExists);
    if (reason) {
      waiting.push({ task: task.id, reason });
      continue;
    }
    if (slots === 0) {
      waiting.push({ task: task.id, reason: `all ${max} slots are busy (max_parallel)` });
      continue;
    }
    release.push(task.id);
    slots -= 1;
  }
  return { release, waiting, inflight, max };
}
