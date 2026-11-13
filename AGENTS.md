# AGENTS.md

## Project
<!-- PROJECT-SPECIFIC. Replace this section in each project; everything else is the reusable `ddd-nextjs` profile. -->
Experimental Next.js application built with strict Domain-Driven Design.
Bounded contexts are NOT yet defined (see "Stop and ask").

## Commands
- Runtime: Node (version in `.nvmrc`). pnpm only: never npm or yarn, never a second lockfile.
- Install: `pnpm install --frozen-lockfile`. Add a dependency: `pnpm add <pkg>`, and justify it in the PR. A person approves every dependency change.
- Env: copy `.env.example` to `.env.local`. Never commit real secrets.
- Database: `docker compose up -d db`. `pnpm db:generate` creates a migration, `pnpm db:migrate` applies it.
- Dev server: `PORT=<free port> pnpm dev`, started in the background and stopped when done.
  For exploring only; checks decide correctness. E2E tests start their own server.
- Fast loop while working: `pnpm verify:fast` (required files, typecheck, lint, architecture boundaries, path references, plan files, UI rules, workflow, secret and dependency checks, unit and integration tests).
- Before declaring done: `pnpm verify` (adds Playwright e2e). CI runs the same checks in two stages.
- If a check fails, read the output and fix the root cause. Never make a check pass by deleting or
  skipping tests, loosening lint or boundary rules, or adding ignore comments. If a check seems
  wrong, stop and ask.

## Architecture
```
src/
  app/            Next.js routes, server actions, client islands (delivery layer)
  ui/             shared presentational components (Tailwind, design tokens)
  composition/    wiring of handlers, repositories, event bus
  contexts/<context>/
    domain/  application/  infrastructure/  testing/
    index.ts      the context's public API
  shared/         shared kernel (Result, base types); imports no context
e2e/              Playwright tests
docs/             domain-language.md, contexts.md, conventions/, guides/
```
- Dependency direction: `app -> composition -> application, infrastructure`; `application -> domain`;
  `infrastructure` implements ports defined in `domain/` or `application/`. `domain` imports nothing
  from other layers or from frameworks.
- `src/app/` is a thin delivery layer with no business logic.
- `src/ui/` imports only React, Next.js and itself. Contexts, shared and composition never import it.
  Browser code lives in `*.client.tsx` files and never imports the backend (`docs/conventions/ui.md`).
- Contexts talk to each other only through a context's public `index.ts` or through domain events.
  Never import another context's internals.
- A context's `index.ts` exports only commands, queries, DTOs, error types, and event types.
  Never aggregates, entities, value objects, or repositories. The delivery layer imports from it to
  build commands and handle errors, and gets the handlers themselves from `src/composition/`.
- Only `src/composition/` may import `infrastructure/` from outside its own context.
- Production code never imports from `testing/`.
- Contexts named `reference-*` are pattern examples, not product code. Copy their structure
  (`docs/guides/reference-slice.md`); never import them, extend them, or build product features in them.
- Enforced by dependency-cruiser (`.dependency-cruiser.cjs`) inside `pnpm verify:fast`. Never weaken it.

## Errors (core rule)
Expected failures are returned as `Result<T, E>` from `src/shared/result.ts`, never thrown.
`throw` is only for bugs and unexpected failures.

## Domain language
Use the terms in `docs/domain-language.md` for all names. If a concept is missing, propose it in that
file's "Proposed terms" section instead of inventing a name.

## Conventions: read before you write
Read the matching file BEFORE writing the code it covers, not after. List it under
"Conventions read" in your PR plan. Reviewers read every file relevant to the PR.

| Before you... | Read |
|---|---|
| create, rename, or move a file | `docs/conventions/naming.md` |
| write or change domain code | `docs/conventions/domain-layer.md` |
| write or change a command, query, or handler | `docs/conventions/application-layer.md` |
| write code that can fail, or handle an error in the delivery layer | `docs/conventions/errors.md` |
| touch `infrastructure/`, tables, repositories, or migrations | `docs/conventions/persistence.md` |
| wire things together, or expose a handler to a route or action | `docs/conventions/composition-root.md` |
| raise, dispatch, or react to a domain event | `docs/conventions/domain-events.md` |
| write or change a page, component, form or style | `docs/conventions/ui.md` |
| add, remove or upgrade a dependency, change a workflow, or handle a secret | `docs/conventions/dependencies.md` |
| write or change tests | `docs/conventions/testing.md` |

## Stop and ask
Do not guess. Label the issue or PR `needs-human`, comment with the question and the options you
see, then stop work on the task, if:
- the task requires a new bounded context or restructuring an existing one
- a migration would drop or alter existing data, or is otherwise not backward compatible
- you need to edit any path listed in `harness/protected-paths.txt` (this file, the conventions,
  CI config, lint and boundary rules, `tsconfig`, ...), the `scripts` in `package.json`,
  deployment config, or secrets
- pnpm refuses an install under its supply-chain rules (a very new version, a trust warning, a source outside the registry), or a package wants an install script
- the same check has failed 3 times in a row

## Workflow
- One task per PR, small and focused. Never push directly to `main`.
- Rebase on `main` before requesting review.
- PR description: what changed, why, decisions made, assumptions, and any existing test you changed
  and the requirement change that justifies it.
