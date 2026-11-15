# DDD Next.js starter

A Next.js starter built for autonomous coding agents: strict DDD with CQRS handlers,
`Result`-based errors, Drizzle on Postgres, and guardrails that are enforced by tools instead
of by prompts.

```bash
nvm use                         # Node from .nvmrc
corepack enable && pnpm install --frozen-lockfile
docker compose up -d db
pnpm db:migrate
pnpm verify                     # typecheck, lint, architecture, tests, e2e
pnpm prove:guardrails           # proves every guardrail actually bites
```

- Start with `docs/guides/bootstrap.md` (build order) and `harness/SETUP.md` (GitHub and Vercel setup).
- Copy the starter with the zip, `cp -a` or `rsync -a`. A copy made with `cp -r starter/*`, or with some file pickers and
  upload tools, silently drops every file whose name starts with a dot (`.github/`, `.dependency-cruiser.cjs`, `.nvmrc`, ...).
  `pnpm check:files` lists anything that is missing, and `pnpm verify:fast` runs it first.
- Rules for agents: `AGENTS.md`, then `docs/conventions/`.
- Worked examples of every convention: `docs/guides/reference-slice.md`.
- The agent pipeline: `harness/pipeline.md` and `.github/workflows/`.

## Repository map
| Folder | What is in it |
|---|---|
| `src/` | the application: `contexts/` (bounded contexts), `composition/` (wiring), `app/` (Next.js delivery), `ui/` (shared components), `shared/` (kernel) |
| `docs/` | conventions, guides, and the project's domain docs (map: `docs/README.md`) |
| `harness/` | the agent pipeline: contract, role prompts, scripts, the protected-paths list (map and copy-manifest: `harness/README.md`) |
| `plan/` | your feature file and the approved plan (guide: `docs/guides/planning.md`) |
| `scripts/` | `checks/` (the guardrails), `db/`, `plan/` (planning tools), `proofs/` (map: `scripts/README.md`) |
| `.github/` | workflows, the setup action, the issue template, CODEOWNERS |
| `e2e/`, `drizzle/` | Playwright tests; database migrations |

## test
