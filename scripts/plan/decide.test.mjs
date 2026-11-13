import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { parseMarker, planRelease, renderIssueBody } from './decide.mjs';

const plan = () => JSON.parse(readFileSync(new URL('../../plan/plan.example.json', import.meta.url), 'utf8'));
const issue = (n, taskId, state = 'open', labels = ['plan-task', 'blocked']) => ({ number: n, taskId, state, labels });
const all = (state) => plan().tasks.map((t, i) => issue(i + 1, t.id, state, ['plan-task', 'blocked']));
const yes = () => true;

describe('issue bodies', () => {
  it('start with the marker and carry the task-issue sections the agent and QA gate expect', () => {
    const task = plan().tasks[2];
    const body = renderIssueBody(task, ['- #1 (T-001)']);
    assert.equal(body.split('\n')[0], '<!-- plan-task:T-003 -->');
    for (const h of ['## Goal', '## Bounded context', '## Acceptance criteria', '## Out of scope', '## Open questions', '## Depends on']) {
      assert.ok(body.includes(h), h);
    }
    assert.ok(body.includes('- [ ] Borrowing a book that is already out is refused'));
    assert.ok(body.includes('- #1 (T-001)'));
    assert.equal(parseMarker(body), 'T-003');
  });

  it('say None. when there are no dependencies or open questions', () => {
    const body = renderIssueBody(plan().tasks[0], []);
    assert.match(body, /## Open questions\nNone\./);
    assert.match(body, /## Depends on\nNone\./);
  });

  it('parseMarker ignores bodies without a marker', () => {
    assert.equal(parseMarker('just text'), null);
    assert.equal(parseMarker(undefined), null);
  });
});

describe('which tasks may start', () => {
  it('starts only the task with no unmet dependency', () => {
    const r = planRelease({ plan: plan(), issues: all('open'), contextExists: yes });
    assert.deepEqual(r.release, ['T-001']);
    assert.ok(r.waiting.some((w) => w.task === 'T-003' && /waiting for T-001/.test(w.reason)));
  });

  it('releases dependents once the dependency issue is closed', () => {
    const issues = all('open');
    issues[0].state = 'closed';
    const r = planRelease({ plan: plan(), issues, contextExists: yes });
    assert.deepEqual(r.release, ['T-002', 'T-003']);
  });

  it('keeps tasks waiting while a dependency is still open', () => {
    const issues = all('open');
    issues[0].state = 'closed'; // T-001 done
    const r = planRelease({ plan: plan(), issues, contextExists: yes });
    const waiting = Object.fromEntries(r.waiting.map((w) => [w.task, w.reason]));
    assert.match(waiting['T-004'], /waiting for T-003/);
    assert.match(waiting['T-005'], /waiting for T-003/);
  });

  it('never exceeds max_parallel, counting open ready issues as busy', () => {
    const p = plan();
    p.policy.max_parallel = 2;
    const issues = all('open');
    issues[0].state = 'closed';
    issues[1].labels = ['plan-task', 'ready']; // T-002 already running
    const r = planRelease({ plan: p, issues, contextExists: yes });
    assert.equal(r.inflight, 1);
    assert.deepEqual(r.release, ['T-003']);
    p.policy.max_parallel = 1;
    const r1 = planRelease({ plan: p, issues, contextExists: yes });
    assert.deepEqual(r1.release, []);
    assert.ok(r1.waiting.some((w) => /slots are busy/.test(w.reason)));
  });

  it('uses the plan order as the priority when slots are scarce', () => {
    const p = plan();
    p.policy.max_parallel = 1;
    const issues = all('open');
    issues[0].state = 'closed';
    assert.deepEqual(planRelease({ plan: p, issues, contextExists: yes }).release, ['T-002']);
  });

  it('defaults to 3 parallel tasks when the plan sets no policy', () => {
    const p = plan();
    delete p.policy;
    p.tasks.forEach((t) => { t.depends_on = []; });
    assert.equal(planRelease({ plan: p, issues: all('open'), contextExists: yes }).release.length, 3);
  });

  it('does not release a task whose context does not exist yet', () => {
    const r = planRelease({ plan: plan(), issues: all('open'), contextExists: (n) => n !== 'catalog' });
    assert.deepEqual(r.release, []);
    assert.ok(r.waiting.some((w) => w.task === 'T-001' && /context catalog does not exist yet/.test(w.reason)));
  });

  it('does not release a task with open questions', () => {
    const p = plan();
    p.tasks[0].open_questions = ['Which fields are public?'];
    const r = planRelease({ plan: p, issues: all('open'), contextExists: yes });
    assert.deepEqual(r.release, []);
    assert.ok(r.waiting.some((w) => w.task === 'T-001' && w.reason === 'has open questions'));
  });

  it('leaves a needs-human task alone', () => {
    const issues = all('open');
    issues[0].labels = ['plan-task', 'blocked', 'needs-human'];
    const r = planRelease({ plan: plan(), issues, contextExists: yes });
    assert.deepEqual(r.release, []);
    assert.ok(r.waiting.some((w) => w.task === 'T-001' && /needs-human/.test(w.reason)));
  });

  it('ignores finished and already released tasks, so repeating a run changes nothing', () => {
    const issues = all('open');
    issues[0].labels = ['plan-task', 'ready'];
    const r = planRelease({ plan: plan(), issues, contextExists: yes });
    assert.deepEqual(r.release, []);
  });

  it('waits for tasks that have no issue yet', () => {
    const r = planRelease({ plan: plan(), issues: [], contextExists: yes });
    assert.deepEqual(r.release, []);
    assert.equal(r.waiting.length, 5);
  });
});
