---
name: feature-to-plan
description: Turn plan/features.md (or plan/features.json) into plan/plan.json - bounded contexts, domain terms, and small tasks - validate it with check-plan, mark every covered feature as planned in plan/planned.json, then commit, push and open the plan pull request. Use when asked to plan features, generate tasks from a feature file, or refresh the plan after features change.
---

# Feature file to plan

Turn a feature file into a plan a person can approve by merging a pull request. This is the
`planner` role (`harness/roles/planner.md`) run locally, plus the sidecar that records what is
planned.

## Read first

1. `AGENTS.md` - the architecture and the "stop and ask" rules.
2. `docs/guides/planning.md` - the feature and plan formats, and what `check:plan` enforces.
3. `harness/schemas/plan.schema.json` - the exact shape of `plan/plan.json`. It is
   `additionalProperties: false`: never invent a field.
4. `harness/roles/planner.md` - what makes a good context, term, task, criterion, dependency.
5. `docs/contexts.md` and `docs/domain-language.md` - use these words, do not invent names.
6. `src/contexts/` - existing context folders. A feature that belongs to one gets status
   `existing`; a new context gets `proposed` and a person creates it with `pnpm new-context`.
7. `plan/features.md` - the input. If the user names another file, use that.
8. `plan/plan.json` and `plan/planned.json` if they exist - never renumber or rewrite tasks that
   a person already approved. Only add what is missing.

## Steps

1. Parse and check the input, so you work from the normalized model and not from prose:

   ```sh
   node scripts/plan/parse-features.mjs plan/features.md
   ```

   (`pnpm` is not always installed; call the scripts through `node`.)

2. Design the plan in this order:
   - **Contexts.** As few as possible, one meaning per word, never `reference-*`. Do not model
     login, email, payments or notifications as a context: those become open questions.
   - **Terms.** Key nouns of the context with a one-line meaning, in the words of the feature file.
   - **Tasks.** One task is one command or one query with its domain behavior and tests, or one
     behavior of an aggregate: small enough for one pull request, size `S` or `M`. Split
     anything that feels bigger. Never "build the whole X".
   - **Criteria.** Observable behavior as a caller sees it, 3 to 40 words, at most 7 per task, and
     **at least one failure behavior** (refused, not found, already exists, invalid). No
     `works well`, `properly`, `correctly`, `intuitive`, `etc.`, no speed claim without a number,
     no criterion that describes how it is built.
   - **Out of scope.** At least one line per task naming the neighbor you are not doing.
   - **Dependencies.** Only tasks whose result this task needs. No cycles. Order tasks the way
     they should be released: foundations first, then feature priority `must`, `should`, `could`.
   - **Open questions.** Anything the feature file leaves undecided and that changes behavior.
     Prefer asking the user with the question tool and writing the answer into the criteria over
     leaving the task unreleasable. Never guess a rule, a limit, a role or a wording.
   - **Coverage.** Every feature has at least one task and every task names a real feature.
   - **Constraints.** Project-wide `## Constraints` from the feature file become criteria where
     they are observable and open questions where they are not.

3. Write `plan/plan.json`:

   ```json
   {
     "version": 1,
     "project": "<project name>",
     "source": "plan/features.md",
     "policy": { "max_parallel": 3 },
     "contexts": [{ "name": "expenses", "purpose": "...", "status": "proposed", "terms": [] }],
     "tasks": [{ "id": "T-001", "title": "...", "feature": "F-001", "context": "expenses",
                 "goal": "...", "criteria": [], "out_of_scope": [], "open_questions": [],
                 "depends_on": [], "size": "S" }]
   }
   ```

   Task ids are `T-001`, `T-002`, ... in release order. `max_parallel` is 1 to 10, default 3.

4. Validate, and fix the root cause until it passes. Warnings do not fail the check, but a task
   with open questions is never released, so clear them or leave them only with the user's
   agreement:

   ```sh
   node scripts/plan/check-plan.mjs --plan plan/plan.json --features plan/features.md
   ```

   Never make the check pass by loosening rules, deleting criteria, or adding ignore comments.
   If the same check fails three times, stop and ask.

5. Mark the features as planned. Write `plan/planned.json` listing exactly the feature ids that
   have at least one task in `plan/plan.json`, in feature-file order:

   ```json
   {
     "version": 1,
     "plan": "plan/plan.json",
     "source": "plan/features.md",
     "features": [
       { "id": "F-001", "status": "planned", "tasks": ["T-001", "T-002"] },
       { "id": "F-002", "status": "planned", "tasks": ["T-003"] }
     ]
   }
   ```

   Rules for the sidecar:
   - `status` is always `planned` here. A feature without tasks is not listed at all: it is still
     requested, not planned.
   - Keep entries for features already in a merged `plan.json` unchanged, and add only new ones.
   - Never put a status inside `plan/plan.json`: its schema forbids extra fields.

6. Commit and open the pull request, following `AGENTS.md`:
   - One task per pull request, never on `main`. Branch name `plan/<slug>`.
   - Stage only `plan/plan.json`, `plan/planned.json` and nothing else; leave unrelated working
     tree changes alone.
   - Rebase on the base branch before pushing if it moved. The base is the branch that holds the
     feature file: if `plan/features.md` is not on the default branch, target the branch that has
     it (check `git ls-tree -r --name-only <branch> -- plan/`).
   - Commit message in the repo's style: lowercase, short, imperative ("add the plan for the
     expense tracking features").
   - PR description covers: what changed, why, the decisions (contexts, task split, sizes), the
     assumptions and open questions, and the exact `check-plan` result.

7. Report the outcome: the `check-plan` line, the task count per feature, and any open question
   that still blocks release.

## Rules

- `plan/` is in `harness/protected-paths.txt`, but `docs/guides/planning.md` says to edit
  `plan/plan.json` through a pull request: the pull request is the intended path. Never edit
  `harness/`, `docs/conventions/`, `.github/`, `scripts/` or the schemas from this skill.
- The plan is a proposal. Merging the pull request is the approval; do not create contexts,
  issues or labels.
- Never weaken `check-plan` or the schemas to make a plan fit.
- Do not invent requirements the feature file does not state. Unknown means an open question.