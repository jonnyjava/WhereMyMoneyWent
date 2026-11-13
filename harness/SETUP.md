# Setup: what the workflows assume

The full build order is in `docs/guides/bootstrap.md`; this file is the GitHub and Vercel
checklist for phases 6 to 8. Do it in this order, and keep `AGENTS_ENABLED` set to
`false` until the mechanical dry run (section 8) passes.

## 1. GitHub App (the agents' identity)
Create an App and install it on this repository only.

Repository permissions:
- Contents: read and write
- Pull requests: read and write
- Issues: read and write
- Actions: read
- Metadata: read

**Do NOT grant the `Workflows` permission.** GitHub then rejects any push that
modifies `.github/workflows/`, so an agent cannot rewrite its own pipeline.

Store: repository variable `APP_ID`, repository secret `APP_PRIVATE_KEY`.

## 2. Secrets and variables
Repository secret:
- `ANTHROPIC_API_KEY`. Agent steps run PR code (tests), so assume the key can be
  read by that code. Use a dedicated key with a low monthly spend limit.

Repository variables:
- `AGENTS_ENABLED` = `false` (flip to `true` after the dry run; flip back to
  `false` any time as the kill switch)
- `PRODUCTION_URL` = the production URL used for the post-promotion check

Environment `production` (Settings > Environments). Restrict deployment
branches to `main`. Secrets live ONLY here, so PR workflows cannot read them:
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `DATABASE_URL` (production Neon connection string)
- `VERCEL_AUTOMATION_BYPASS_SECRET` (if deployment protection is on; verify the
  current "Protection Bypass for Automation" docs and make the tests send it)

## 3. Repository settings
- Allow auto-merge. Allow squash merging only. Delete branches on merge.
- Actions > General > Workflow permissions: read repository contents by default.
- Branch protection on `main`:
  - Require a pull request; no direct pushes; include administrators
  - Require status checks: `verify` (workflow CI) and `gate` (workflow Pipeline)
  - Require review from code owners
- Security settings (Settings > Code security): turn on **secret scanning** and **push protection**, **Dependabot
  alerts**, and **Dependabot security updates**. Code scanning (CodeQL) is optional; some of these need GitHub
  Advanced Security on a private repository. `.github/dependabot.yml` and the weekly `security.yml` need no
  extra setting.
- Check, with a throwaway PR, that a required check whose job was skipped by an
  `if:` counts as passing. The workflows rely on that: `verify` is skipped on
  agent PRs, and `gate` reports `skip` on non-agent PRs.

## 4. CODEOWNERS (generated, never hand-edited)
`harness/protected-paths.txt` lists the paths agents must never change, and
`harness/human-approval-paths.txt` lists the ones they may change but only you may approve (the
lockfile). Generate the file from both, and regenerate whenever either list changes:
```
bash harness/bin/protected-paths.sh codeowners harness/protected-paths.txt @your-github-username harness/human-approval-paths.txt > .github/CODEOWNERS
```
A PR touching those paths cannot auto-merge without your review. The pipeline
guard enforces the same list at run time, and withholding the `Workflows`
permission from the App protects the workflow files themselves.

## 5. Scripts the workflows call (package.json)
All of these exist in the starter and have been run. Keep their names: the workflows
depend on them, and changing the `scripts` in `package.json` is blocked for agents.

| Script | Purpose |
|---|---|
| `check:files`, `typecheck`, `lint`, `arch`, `check:references`, `check:plan`, `check:ui`, `check:workflows`, `check:secrets`, `check:dependencies`, `test:plan`, `test` | the parts of `verify:fast`. `lint` includes the file-naming check; `arch` fails if dependency-cruiser examines fewer modules than there are source files; `check:references` fails when a path mentioned in a workflow, script, config, doc or source file does not exist; `check:plan` validates `plan/features.*` and `plan/plan.json` when they exist; `check:ui` enforces design tokens, no inline styles, and where `'use client'` and `'use server'` may appear; `check:workflows` requires pinned actions, declared permissions and no untrusted text in shell scripts; `check:secrets` looks for committed keys, tokens and env files; `check:dependencies` keeps pnpm's supply-chain settings on and the lockfile registry-only; `test:plan` runs the tests of the planning tools |
| `verify:fast` | all of the above |
| `verify` | `verify:fast` + `test:e2e` |
| `test:e2e` | Playwright; builds and serves the production bundle itself |
| `test:postdeploy` | Playwright smoke tests against `BASE_URL` (a deployed URL) |
| `check:migrations` | flags migrations that are not backward compatible with a `NEEDS_HUMAN:` line. By default it checks files added on the branch, diffing against `origin/$BASE_REF` (the pipeline sets it and fetches full history). `--all` checks every file |
| `db:generate`, `db:migrate` | drizzle-kit generate; apply with `scripts/db/migrate.mjs` |
| `prove:guardrails` | proves every guardrail bites. Run it after changing any tooling |
| `test:pipeline` | tests the pipeline's guard and gate decision logic against stubbed inputs, with no GitHub. Run it after editing `pr-pipeline.yml` or the protected list |
| `plan:preview` | prints what plan sync would do, without reading or changing GitHub |
| `new-context` | creates a bounded context by hand (`<name>`), or every proposed one (`--from-plan`). A person runs it |

Dependencies the workflows need are already in `package.json`: `vercel`, `@playwright/test`,
`server-only`. TypeScript is pinned to `^6`: dependency-cruiser does not support 7 yet.
`pnpm-workspace.yaml` records which dependency build scripts may run (`allowBuilds`), pnpm's
supply-chain settings, and the reviewed exceptions and audit findings, each with its reason. It is a
protected path.

## 6. Labels
Created automatically when first used: `needs-human`, `round-1..3`,
`regression`, `regression-attempt-1`, `digest-log`, `harness-feedback`, and, by plan sync,
`plan-task`, `blocked`, `ready` and `ctx:<context>`; by the gate, `awaiting-approval`; by the
weekly audit, `security`. Create `ready` yourself if you label issues by hand.

## 7. Verify before trusting
- Flags in `harness/bin/run-agent.sh` against the agent CLI's current docs
- Action versions: every action is already pinned to a commit (`pnpm check:workflows` enforces it), but
  newer major versions exist. Dependabot proposes the upgrades; review each like a dependency
- Vercel protection bypass for post-deploy tests

## 8. Dry run (with `AGENTS_ENABLED=false`)
1. Open a human PR that changes only a README: `verify` runs and passes; `gate`
   (Pipeline) passes as skipped.
2. Open a throwaway draft PR from a branch named `agent/test`: `gate` reports skip.
3. Set `AGENTS_ENABLED=false` and mark it ready: `gate` fails with the kill-switch message.
4. Open a PR that changes a protected path (for example a comment in `AGENTS.md`) and one
   that edits a `scripts` entry in `package.json`: from an `agent/*` branch the gate must
   fail with the "protected paths" and "package.json scripts" messages.

Do NOT run an agent task yet. `reference-*` contexts are pattern examples that agents must
not extend, so the first real task waits for a real context (`docs/guides/bootstrap.md`, phases 9
and 10). Then set `AGENTS_ENABLED=true`, create a tiny `ready` issue with 1 to 2 criteria in
that context, and watch one full cycle.
