# Bootstrap order

Build the repository in this order. Each phase makes the next one safe, and each ends with a
check you can run, so you never move on on faith.

You do this with an interactive agent at your side if you like, but **not** with the
autonomous pipeline: the guardrails that make it safe do not exist until phase 6.

This starter already contains phases 1 to 5, built and verified (see the last section). Phases
0 and 6 to 10 need your accounts, so they are steps for you.

| # | Phase | Why it is here |
|---|---|---|
| 0 | Accounts and decisions | Cheap now, blocks everything later |
| 1 | Scaffold | Nothing else can exist without it |
| 2 | Guardrails | The whole premise is guardrails before agents |
| 3 | Database | Needs the scaffold and the test tooling |
| 4 | Reference slice | Agents copy the patterns they see; an empty repo shows none |
| 5 | Prove the guardrails bite | An unverified guardrail is a guess |
| 6 | GitHub: CI, then branch protection | Required checks only become selectable after they have run once |
| 7 | Deploy path | Do it by hand first, automate after you have seen it work |
| 8 | Mechanical dry run | Prove the pipeline plumbing with no agent in the loop |
| 9 | Context discovery | Agents cannot build features until contexts exist |
| 10 | First agent task | Small, in a real context, watched closely |

---

## Phase 0: Accounts and decisions
- A private GitHub repository.
- A Vercel project, and a Neon project (Postgres). Note the Vercel org id, project id and a token.
- An Anthropic API key **dedicated to this pipeline, with a low monthly spend limit**. Agent
  steps run code from PRs, so assume the key can be read by that code.
- A GitHub App (see `harness/SETUP.md`, section 1).

**Done when** you hold: repo URL, Vercel token and ids, the Neon connection string, the API
key, and the App id and private key.

## Phases 1 to 3: Scaffold, guardrails, database (done in this starter)
Reproduce them locally:
```bash
nvm use && corepack enable
pnpm install --frozen-lockfile
docker compose up -d db
pnpm db:migrate
pnpm verify:fast
```
**Done when** `pnpm verify:fast` passes from a clean checkout: typecheck, lint (including the
ban on disable comments and skipped tests, and the file-naming check), the architecture rules,
the path-reference check, and the tests against a real Postgres.

## Phase 4: Reference slice (done, but you must read it)
`docs/guides/reference-slice.md` maps every convention to a file. Read that code yourself before any
agent runs. It is the pattern every agent will copy, so a flaw here is copied everywhere.

**Done when** you have read it and either accept it or change it.

## Phase 5: Prove the guardrails bite
```bash
pnpm prove:guardrails
```
It applies one deliberate violation at a time (a domain file importing infrastructure, an
`eslint-disable`, a skipped test, a wrongly named file, a destructive migration, ...) and
checks that the right rule fails, plus controls that must still pass.

**Done when** it reports `0 failed`. Re-run it after any change to lint, architecture, naming
or migration tooling, and after upgrading TypeScript, ESLint, or dependency-cruiser.

## Phase 6: GitHub, CI first, protection second
Order matters, because a required check can only be selected after it has run once.
1. Create the repo and push to `main` (protection is still off, so this one direct push is fine).
2. Generate `CODEOWNERS` from the two path lists (protected, and needs-approval):
   `bash harness/bin/protected-paths.sh codeowners harness/protected-paths.txt @your-username harness/human-approval-paths.txt > .github/CODEOWNERS`
3. Open a small human PR so that `CI / verify` and `Pipeline / gate` run once.
4. Enable branch protection on `main` (`harness/SETUP.md`, section 3): require a PR, require the
   `verify` and `gate` checks and code-owner review, and include administrators.
5. Confirm that a required check whose job was **skipped** counts as passing. The workflows
   rely on it (`verify` is skipped on agent PRs, `gate` reports skip on human PRs).

**Done when** a human PR can merge only after `verify` passes, and a direct push to `main` is refused.

## Phase 7: Deploy path
By hand first:
```bash
pnpm exec vercel pull --yes --environment=production
pnpm exec vercel build --prod
URL=$(pnpm exec vercel deploy --prebuilt --prod --skip-domain)   # not served to users yet
BASE_URL=$URL pnpm test:postdeploy                               # smoke tests on that URL
pnpm exec vercel promote "$URL" --yes                            # now it is live
```
If Vercel deployment protection blocks the smoke tests, wire its automation bypass secret into
`playwright.postdeploy.config.ts` (check Vercel's current docs for the header and variable).
Then create the `production` environment with its secrets (`harness/SETUP.md`, section 2) and
let `deploy.yml` do the same on a trivial merge.

**Done when** a merge to `main` migrates, stages, tests, and promotes a deployment on its own,
and a deliberately failing post-deploy test leaves the previous version live and opens a
`regression` issue.

## Phase 8: Mechanical dry run (no agent runs yet)
Follow `harness/SETUP.md`, section 8, steps 1 to 3, with `AGENTS_ENABLED=false`: a human PR passes,
a draft `agent/*` PR is skipped, and a ready `agent/*` PR fails closed with the kill-switch message.
Also check that a PR touching a protected path, or the `scripts` in `package.json`, is blocked.
`pnpm test:pipeline` runs the guard and gate logic of the workflow against stubbed inputs
(40 scenarios, including "fails closed when `gh` errors"), so you can check the decision logic
before GitHub ever runs it.

**Done when** all of those behave as described, on GitHub and in `pnpm test:pipeline`.

## Phase 9: Context discovery
Human-led (an agent can facilitate). Output: `docs/contexts.md` and per-context terms in
`docs/domain-language.md`. Start with fewer contexts than you think, put the core domain first,
and buy the generic parts (auth, payments, email) instead of modeling them. Create each context
folder with `pnpm new-context <name>` (it creates the layers, the public `index.ts` and the doc entries).
If you have a feature list, use the planning layer instead (`docs/guides/planning.md`): the planner
proposes contexts and terms, you approve them in a pull request, and `pnpm new-context --from-plan`
creates the folders.

**Done when** at least one real context exists, scaffolded by you.

## Phase 10: First agent task
Set `AGENTS_ENABLED=true`, write a tiny `ready` issue in a real context with one or two
observable criteria, and watch one full cycle: plan, tests first, gates, merge, deploy.
Then read the weekly digest and the `harness-feedback` issue, and prune `AGENTS.md`.

**Done when** one task has gone from issue to deployed, and you have fixed whatever the
reviewers or the pipeline got wrong.

---

## Pitfalls found while building this starter (all fixed)
1. **dependency-cruiser did not support TypeScript 7.** It examined 0 modules and reported "no
   violations". TypeScript is pinned to `^6`, and `scripts/checks/check-architecture.mjs` now fails
   whenever the tool examines fewer modules than there are source files. Upgrade TypeScript only
   together with `pnpm prove:guardrails`.
2. **`pnpm install --frozen-lockfile` failed on a clean checkout** (`ERR_PNPM_IGNORED_BUILDS`)
   because pnpm 12 refuses unapproved dependency build scripts. The decision is explicit in
   `pnpm-workspace.yaml` (`allowBuilds`), which is a protected path.
3. **The first draft of the architecture rules forbade what the convention requires**: handler
   tests importing their in-memory fakes. Fixed with a rule limited to test files.
4. **A lint rule was missing for skipped tests.** The docs forbade it, nothing enforced it.
5. **Local passes hid CI failures.** Verify from a clean checkout (no `node_modules`), as CI does.
6. **Moving a file breaks references that no linter checks** (workflows, scripts, docs, UI strings).
   `scripts/checks/check-references.mjs`, part of `verify:fast`, fails when a mentioned path does not
   exist, and refuses to pass when it finds almost nothing to check.

## What was verified, and what was not
Verified by running it (Node 22, pnpm 12.16, TypeScript 6.0, PostgreSQL 16):
- clean-checkout install and the complete `pnpm verify` with `CI=1`: typecheck, lint, naming,
  architecture (99 modules, 19 rules), UI, workflow, secret and dependency checks, 52 unit, component and integration tests (the
  integration ones against real Postgres), production build, and 7 e2e tests in Chromium including
  an accessibility scan
- the post-deploy smoke tests, passing against a running server and failing against a dead one
- the migration check in both modes (all files, and only files added on a branch)
- 90 guardrail proofs, including the architecture self-check, the path-reference check, the UI rules, the supply-chain checks, and the controls
- 63 tests of the planning tools (run against a stub `gh` and a stub planner, never against GitHub)
- 40 scenarios for the pipeline's guard and gate logic, extracted verbatim from the workflow and run
  under the same shell flags GitHub uses
- `actionlint` on all workflows and `shellcheck` on all scripts

**Not verified** (they need your accounts): any GitHub Actions run, the GitHub App, branch
protection treating skipped checks as passing, Vercel deploy, promote, rollback and protection
bypass, Neon, the agent CLI flags in `harness/bin/run-agent.sh`, the Plan, Plan sync and Security audit
workflows on GitHub, Dependabot, the approval step on a real dependency pull request, a planner answer from a real model, and Postgres 17 (CI and `docker-compose.yml` use 17,
the sandbox ran 16). The UI was checked in a headless browser only, never reviewed by eye.
7. **Hidden files are lost by naive copies.** `cp -r starter/*` and some file pickers skip names that start with a dot, and the first
   symptom is a confusing error far from the cause (`Can't open config file '.dependency-cruiser.cjs'`). The tool's advice, `depcruise --init`,
   would create a config with none of the project's rules. `pnpm check:files` now lists every missing hidden file and runs first in
   `verify:fast`, and `check-architecture.mjs` fails unless all 19 required rules are loaded as errors.
8. **Tests that depend on the environment fail only in someone else's.** The planning tests failed under Node 20 (`node --test "glob"` does not expand a glob before Node 21) and in a
   project path that contains a space (`new URL(...).pathname` percent-encodes it), and they copied whatever the live project had written in `docs/`. Now the shell expands the
   glob, paths come from `fileURLToPath`, the tests carry their own fixture documents, a stub executable gets its own `package.json` (a temp folder inside the project would
   otherwise make it an ES module), `check:files` reports an older Node than `engines` asks for, and every guardrail proof runs in a folder whose name contains a space.
