# Planning: from a feature list to released tasks

You hand the harness a feature list. It does not build features directly: a **planner** turns the list
into small tasks, **you approve the plan**, and tasks are released to the coding agent as their
dependencies finish. This guide covers the flow, both file formats, what the checks enforce, and where
you step in.

## The flow

1. **You write a feature file**: `plan/features.md` or `plan/features.json` (formats below).
2. **Run the Plan workflow** (Actions tab, Plan, Run workflow; or `gh workflow run plan.yml`). A read-only
   planner proposes bounded contexts, domain terms and tasks. Tools check its answer. If the answer is
   rejected, the planner gets one more attempt with the messages. A pull request adds `plan/plan.json`.
3. **You review the pull request**: contexts, terms and above all each task's acceptance criteria. Edit
   `plan/plan.json` in the pull request if needed; CI runs `pnpm check:plan` on your edits.
4. **Merging the pull request is the approval.** Nothing is created from a plan nobody merged.
5. **Create the proposed contexts**: run `pnpm new-context --from-plan`, review `docs/contexts.md` and
   `docs/domain-language.md`, and push. A person creates contexts on purpose; agents must stop and ask.
6. **Plan sync** (`.github/workflows/plan-sync.yml`) creates one issue per task and releases the tasks
   that may start (label `ready`, coding agent started). When a task's pull request merges, its issue
   closes and sync releases what was waiting for it.

```
features.md --> planner --> checks --> plan PR --> you merge --> new-context --> issues --> coding agent
                              ^  |                                                  ^           |
                              +--+ one retry                                        +-- next ---+
```

## Writing the feature file

Markdown (parsed strictly: text it cannot place is an error, never silently dropped):

```markdown
# Neighborhood Library

A small web service where members borrow and return books.

## Constraints
- Members are identified by their email address.

## F-001 Browse the catalog
Goal: Anyone can see which books exist and whether they are available.
Priority: must
Criteria:
- Anyone can list all books with title, author and availability.
Out of scope:
- Reserving a book that is out.

## F-002 Borrow a book
Goal: A member can borrow an available book.
Depends on: F-001
Criteria:
- Borrowing a book that is already out is refused.
```

| Field | Required | Meaning |
| --- | --- | --- |
| `# Project name` | yes | The first heading; a short paragraph under it is the summary |
| `## Constraints` | no | Bullets that apply to the whole project (security, compliance, budgets, limits) |
| `## F-001 Title` | yes | One feature: the id is `F-` and three digits |
| `Goal:` | yes | What becomes possible, and why (400 characters at most) |
| `Priority:` | no | `must`, `should` or `could`; the planner orders tasks by it |
| `Depends on:` | no | Feature ids, separated by commas |
| `Context:` | no | A hint for the bounded context |
| `Criteria:` | no | Rough acceptance criteria, one `- ` bullet each; the planner makes them testable |
| `Out of scope:` | no | Bullets: what you do not want |
| `Notes:` | no | Free text |

JSON has the same fields and is checked against `harness/schemas/feature-spec.schema.json`. The two
examples, `plan/features.example.md` and `plan/features.example.json`, describe the same project, and a
test proves that they parse to the same thing.

You do **not** need to write contexts, task sizes or task dependencies. The planner proposes them.
What helps most: one capability per feature that a user could name, the failure behavior you expect
("refused", "not found"), and what you explicitly do not want.

## What the plan looks like

`plan/plan.json` (shape: `harness/schemas/plan.schema.json`, example: `plan/plan.example.json`) holds:
- **contexts**: `name`, `purpose`, `status` (`existing` or `proposed`) and key `terms`;
- **tasks**, in release order: `id` (`T-001`), `title`, `feature`, `context`, `goal`, `criteria`
  (observable behaviors, 1 to 7), `out_of_scope` (at least one), `open_questions`, `depends_on`, `size` (`S` or `M`);
- **policy.max_parallel**: how many tasks may be in flight at once (1 to 10, default 3).

Each task becomes an issue in the task-issue format, so the coding agent's intake check and the QA gate
work on it unchanged.

## What `pnpm check:plan` enforces

- **Shape**: both schemas; unique ids; every dependency exists; no cycles; every task's context is declared;
  an `existing` context has its folder; no context named `reference-...`.
- **Coverage**: every feature has at least one task, and every task names a real feature.
- **Size**: at most 7 criteria and at least one out-of-scope line per task; no task of size L.
- **Criteria quality**: 3 to 40 words; no vague phrases (`works well`, `properly`, `correctly`,
  `appropriately`, `intuitive`, `seamless`, `robust`, `easily`, `etc.`, `and so on`, `as needed`); a speed
  claim needs a number; no criterion that describes how something is built ("Create a repository class").
- **Warnings** (they do not fail): a criterion that may hold more than one behavior, a task with no failure
  case, a task with open questions (it will not be released).

These checks catch vague wording, **not wrong requirements**. Read the criteria yourself, especially for
the first features.

## When a task is released

A task is released (label `ready`, coding agent started) only when **all** of these hold:

| Condition | Otherwise it waits because |
| --- | --- |
| Its issue exists and is open, and is not yet `ready` | already released or done |
| Every task it depends on has a **closed** issue | `waiting for T-00x` |
| Its context exists as a folder with an `index.ts` | `context x does not exist yet` |
| It has no open questions | `has open questions` |
| It is not labeled `needs-human` | a person is already looking at it |
| Fewer than `max_parallel` issues are open and `ready` | `all N slots are busy` |

Tasks are considered in plan order, so the planner's ordering is the priority. Closing an issue counts as
done, even if someone closes it as "not planned": that releases its dependents.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm check:plan` | Checks the feature file and the plan, if present (part of `pnpm verify:fast`) |
| `pnpm plan:preview` | Prints what sync would do, without reading or changing GitHub |
| `pnpm new-context <name>` | Creates one context by hand; `--from-plan` creates every proposed one |
| `pnpm test:plan` | The tests of the planning tools, which need no GitHub |

## Changing the plan later

Edit `plan/plan.json` through a pull request. New tasks get issues. **Sync never edits an existing
issue**: if you change the criteria of a task that has started, edit its issue by hand. A task removed
from the plan leaves its issue behind: close it.

## Where you step in

- Reviewing the plan pull request, above all the criteria.
- Answering open questions: edit them out of the task, in a pull request.
- Creating contexts with `pnpm new-context --from-plan`.
- Tasks labeled `needs-human`: the pipeline stopped there and left a comment.

## Limits

- The planner has not been run against a real model yet. Its plans are checked for form, so expect to edit
  them at first.
- UI tasks follow `docs/conventions/ui.md`. A new design token is a person's decision, so the planner raises it as an open question.
- `max_parallel` caps how many tasks run at once, **not total spend**. Use a dedicated API key with a spend limit.
- A plan covers one repository.
- Plan sync uses the default token (issues and actions write). The Plan workflow uses the same GitHub App and
  secrets as the other workflows (`harness/SETUP.md`).
