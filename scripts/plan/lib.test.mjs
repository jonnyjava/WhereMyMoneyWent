import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { parseFeaturesMarkdown, readFeatureFile, topoOrder, validateFeatureSpec, validatePlan } from './lib.mjs';

const read = (p) => readFileSync(new URL(`../../plan/${p}`, import.meta.url), 'utf8');
const example = () => JSON.parse(read('plan.example.json'));
const features = () => readFeatureFile(fileURLToPath(new URL('../../plan/features.example.md', import.meta.url))).model;
const contextExists = () => true;

describe('feature files', () => {
  it('the Markdown and JSON examples describe exactly the same project', () => {
    const md = parseFeaturesMarkdown(read('features.example.md'));
    assert.deepEqual(md.errors, []);
    assert.deepEqual(md.model, JSON.parse(read('features.example.json')));
  });

  it('the example feature file is valid', () => {
    assert.deepEqual(validateFeatureSpec(parseFeaturesMarkdown(read('features.example.md')).model), []);
  });

  it('reports a heading that is not a feature, with its line number', () => {
    const { errors } = parseFeaturesMarkdown('# P\n\n## Random section\n');
    assert.match(errors[0], /line 3: unexpected heading/);
  });

  it('refuses text it cannot place instead of dropping it silently', () => {
    const { errors } = parseFeaturesMarkdown('# P\n\n## F-001 A\nGoal: g\nsome stray sentence\n');
    assert.match(errors[0], /line 5: cannot read "some stray sentence" under F-001/);
  });

  it('wants each criterion on its own bullet', () => {
    const { errors } = parseFeaturesMarkdown('# P\n\n## F-001 A\nGoal: g\nCriteria: one, two\n');
    assert.match(errors[0], /own "- " bullet/);
  });

  it('requires a project name', () => {
    const { errors } = parseFeaturesMarkdown('## F-001 A\nGoal: g\n');
    assert.ok(errors.some((e) => /missing the project name/.test(e)));
  });

  it('rejects duplicate ids, unknown and circular dependencies, and a bad priority', () => {
    const base = { project: 'P', features: [{ id: 'F-001', title: 'a', goal: 'g' }, { id: 'F-001', title: 'b', goal: 'g' }] };
    assert.match(validateFeatureSpec(base).join(), /duplicate feature id/);
    const unknown = { project: 'P', features: [{ id: 'F-001', title: 'a', goal: 'g', depends_on: ['F-009'] }] };
    assert.match(validateFeatureSpec(unknown).join(), /F-009, which is not in the file/);
    const cycle = { project: 'P', features: [
      { id: 'F-001', title: 'a', goal: 'g', depends_on: ['F-002'] },
      { id: 'F-002', title: 'b', goal: 'g', depends_on: ['F-001'] },
    ] };
    assert.match(validateFeatureSpec(cycle).join(), /dependency cycle: F-001 -> F-002 -> F-001/);
    const bad = { project: 'P', features: [{ id: 'F-001', title: 'a', goal: 'g', priority: 'urgent' }] };
    assert.match(validateFeatureSpec(bad).join(), /priority/);
  });

  it('orders dependencies first and keeps the given order otherwise', () => {
    const items = [{ id: 'c', deps: ['a'] }, { id: 'b', deps: [] }, { id: 'a', deps: [] }];
    assert.deepEqual(topoOrder(items, (i) => i.id, (i) => i.deps).map((i) => i.id), ['a', 'c', 'b']);
  });
});

describe('plan validation', () => {
  it('accepts the example plan, cross-checked with the example features', () => {
    const { errors, warnings } = validatePlan(example(), { features: features(), contextExists });
    assert.deepEqual(errors, []);
    assert.deepEqual(warnings, []);
  });

  const withTask = (patch) => {
    const plan = example();
    Object.assign(plan.tasks[0], patch);
    return validatePlan(plan, { contextExists }).errors.join('\n');
  };

  it('rejects criteria that say "works" instead of what can be observed', () => {
    assert.match(withTask({ criteria: ['The list works well for everyone.'] }), /works well.*instead of what can be observed/);
  });

  it('rejects unmeasurable adverbs and quality claims', () => {
    assert.match(withTask({ criteria: ['Books are shown properly to the visitor.'] }), /properly/);
    assert.match(withTask({ criteria: ['The list is intuitive for visitors to read.'] }), /intuitive.*quality claim/);
    assert.match(withTask({ criteria: ['The list shows titles, authors, etc. for each book.'] }), /open-ended/);
  });

  it('wants a number with a speed claim', () => {
    assert.match(withTask({ criteria: ['The list loads fast for every visitor.'] }), /needs a number/);
    assert.equal(withTask({ criteria: ['The list loads within 2 seconds for every visitor.', 'An empty catalog returns an empty list.'] }), '');
  });

  it('rejects criteria that describe how it is built', () => {
    assert.match(withTask({ criteria: ['Create a repository class for books.'] }), /how it is built/);
    assert.equal(withTask({ criteria: ['Add a book to the catalog and see it in the list.', 'Adding a duplicate title is refused.'] }), '');
  });

  it('rejects more than 7 criteria and tasks of size L', () => {
    assert.match(withTask({ criteria: Array.from({ length: 8 }, (_, i) => `Visitor sees result number ${i + 1} in the list.`) }), /criteria.*must NOT have more than 7/);
    assert.match(withTask({ size: 'L' }), /size/);
  });

  it('rejects a task with no out-of-scope line', () => {
    assert.match(withTask({ out_of_scope: [] }), /out_of_scope/);
  });

  it('rejects an undeclared context, and reference- contexts', () => {
    assert.match(withTask({ context: 'billing' }), /context "billing" is not declared/);
    const plan = example();
    plan.contexts[0].name = 'reference-catalog';
    plan.tasks.forEach((t) => { if (t.context === 'catalog') t.context = 'reference-catalog'; });
    assert.match(validatePlan(plan, { contextExists }).errors.join(), /pattern examples, never product contexts/);
  });

  it('rejects an existing context whose folder is missing', () => {
    const plan = example();
    plan.contexts[0].status = 'existing';
    const { errors } = validatePlan(plan, { contextExists: () => false });
    assert.match(errors.join(), /marked existing, but src\/contexts\/catalog does not exist/);
  });

  it('rejects unknown, self and circular dependencies and duplicate ids', () => {
    assert.match(withTask({ depends_on: ['T-099'] }), /T-099, which is not in the plan/);
    assert.match(withTask({ depends_on: ['T-001'] }), /depends on itself/);
    const cycle = example();
    cycle.tasks[0].depends_on = ['T-002'];
    assert.match(validatePlan(cycle, { contextExists }).errors.join(), /dependency cycle: T-001 -> T-002 -> T-001/);
    const dup = example();
    dup.tasks[1].id = 'T-001';
    assert.match(validatePlan(dup, { contextExists }).errors.join(), /duplicate task id/);
  });

  it('requires every feature to be covered and every task to point at a real feature', () => {
    const plan = example();
    plan.tasks = plan.tasks.filter((t) => t.feature !== 'F-003');
    assert.match(validatePlan(plan, { features: features(), contextExists }).errors.join(), /F-003: no task covers this feature/);
    const stray = example();
    stray.tasks[0].feature = 'F-009';
    assert.match(validatePlan(stray, { features: features(), contextExists }).errors.join(), /F-009 is not in the feature file/);
  });

  it('warns, without failing, about open questions and a missing failure case', () => {
    const plan = example();
    plan.tasks[0].open_questions = ['Should hidden books be listed?'];
    plan.tasks[1].criteria = ['Searching for a title fragment returns only books whose title contains it.'];
    const { errors, warnings } = validatePlan(plan, { contextExists });
    assert.deepEqual(errors, []);
    assert.ok(warnings.some((w) => /T-001: has 1 open question/.test(w)));
    assert.ok(warnings.some((w) => /T-002: no criterion describes a failure case/.test(w)));
  });

  it('bounds max_parallel', () => {
    const plan = example();
    plan.policy.max_parallel = 0;
    assert.match(validatePlan(plan, { contextExists }).errors.join(), /max_parallel/);
  });
});
