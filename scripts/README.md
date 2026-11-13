# Scripts

```
scripts/
├── checks/   the guardrails themselves. Each prints what is wrong and exits 1.
├── db/       database helpers.
├── plan/     the planning tools (parse, check, sync issues, create contexts) and their tests.
└── proofs/   tools that prove the guardrails and the pipeline logic work.
```

| Script | Run by | What it does |
|---|---|---|
| `checks/check-architecture.mjs` | `pnpm arch` (in `verify:fast`) | runs dependency-cruiser, and fails if it examined fewer modules than there are source files, or if the config does not hold all 19 required rules as errors |
| `checks/check-files.mjs` | `pnpm check:files` (first in `verify:fast`) | lists every missing hidden file (a copy that skipped dotfiles) and says how to copy correctly, and fails with a plain message when Node is older than `engines` asks for |
| `checks/check-names.mjs` | `pnpm lint` | file names: kebab-case, plus a role suffix that fits the layer |
| `checks/check-references.mjs` | `pnpm check:references` (in `verify:fast`) | every repo path mentioned in a workflow, script, config, doc or source file exists |
| `checks/check-ui.mjs` | `pnpm check:ui` (in `verify:fast`) | UI rules a linter cannot express: tokens only, no inline style, `"use client"` only in `*.client.tsx`, `"use server"` only in `actions.ts` |
| `checks/check-workflows.mjs` | `pnpm check:workflows` (in `verify:fast`) | every action pinned to a commit with a version comment, permissions declared, no `pull_request_target`, no untrusted text in shell scripts |
| `checks/check-secrets.mjs` | `pnpm check:secrets` (in `verify:fast`) | looks for committed private keys, API tokens, database URLs with credentials and env files; reports where, never the value |
| `checks/check-dependencies.mjs` | `pnpm check:dependencies` (in `verify:fast`) | pnpm's supply-chain settings stay on, no non-registry direct dependency, every locked package comes from the registry with an integrity hash |
| `checks/check-migrations.mjs` | `pnpm check:migrations` (pipeline) | flags migrations that are not backward compatible with a `NEEDS_HUMAN:` line |
| `db/migrate.mjs` | `pnpm db:migrate` (deploy) | applies the migrations in `drizzle/` |
| `scripts/plan/check-plan.mjs` | `pnpm check:plan` (in `verify:fast`) | validates the feature file and the plan: shapes, dependencies, coverage, and the quality of the criteria |
| `scripts/plan/sync-issues.mjs` | `plan-sync.yml`, `pnpm plan:preview` | creates the task issues of the approved plan and releases the tasks that may start |
| `scripts/plan/new-context.mjs` | `pnpm new-context` | creates a bounded context and registers it in the docs. A person runs it |
| `scripts/plan/parse-features.mjs`, `scripts/plan/extract-plan.mjs` | `plan.yml` | read a feature file as JSON; pull the plan out of the planner's answer |
| `scripts/plan/*.test.mjs` | `pnpm test:plan` (in `verify:fast`) | the tests of the planning tools, with a stub `gh` instead of GitHub |
| `proofs/prove-guardrails.sh` | `pnpm prove:guardrails` | applies deliberate violations and checks the right guardrail fails |
| `proofs/test-pipeline-logic.sh` | `pnpm test:pipeline` | runs the pipeline's guard and gate logic against stubbed inputs |

Rules of thumb:
- Run `pnpm prove:guardrails` after changing any check or upgrading TypeScript, ESLint, or dependency-cruiser.
- Run `pnpm test:pipeline` after editing `.github/workflows/pr-pipeline.yml` or `harness/protected-paths.txt`.
- A path in a script that is meant to be fake (a file a test creates on the fly) carries a
  `refs:ignore` comment, so the exception is visible where it happens.
- The folder is a protected path: agents cannot add or change scripts, and `package.json`
  `scripts` entries are blocked for them too.
