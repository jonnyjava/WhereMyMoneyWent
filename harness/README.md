# Harness

Everything that runs and governs the autonomous agent pipeline. The flow itself is described
in `pipeline.md`; this page is the map.

```
harness/
├── pipeline.md             the contract every role and workflow follows (stages, verdicts, rounds, escalation)
├── SETUP.md                the GitHub and Vercel checklist (App, secrets, branch protection, dry run)
├── protected-paths.txt     paths agents must never modify: the ONE list, read by the guard and by CODEOWNERS
├── roles/                  one prompt per agent role
│   ├── coding-agent.md
│   ├── architecture-reviewer.md
│   ├── qa-gate.md
│   └── planner.md          turns a feature file into a plan (read-only)
├── schemas/                the JSON Schemas of the feature file and the plan
└── bin/                    the scripts the workflows call
    ├── run-agent.sh        the only place that knows which agent tool runs a role
    ├── parse-verdict.sh    reads VERDICT from an agent's output; fails closed
    ├── build-context.sh    builds what a reviewer receives for a PR
    └── protected-paths.sh  matches files against the list; generates CODEOWNERS
```

## Who edits what
| File | Edited by | How often |
|---|---|---|
| `roles/*.md` | you, after seeing real reviews | weekly at first, then rarely |
| `pipeline.md`, `bin/*` | you | rarely; change them together with `.github/workflows/` |
| `protected-paths.txt` | you | rarely; then regenerate `.github/CODEOWNERS` (command in the file) |
| `SETUP.md` | you | when infrastructure changes |

Agents cannot edit any of this: the whole folder is a protected path.

## Copying this to another project
The harness cannot live in one folder: tools fix the location of some files (`.github/`,
`AGENTS.md`, the root configs). Copy by tier:

**1. Harness core. Copy unchanged into every project.**
- `harness/` (this folder, except any project-specific lines in `protected-paths.txt`)
- `.github/workflows/pr-pipeline.yml`, `coding-agent.yml`, `digest.yml`, `ci.yml`, `plan.yml`, `plan-sync.yml`
- `.github/actions/setup/`, `.github/ISSUE_TEMPLATE/task.md`
- `scripts/proofs/`, `scripts/plan/`, and `scripts/checks/check-references.mjs`
- `plan/README.md` and the three example files in `plan/`

**2. Stack profile. Copy to projects with the same stack** (Next.js, DDD, CQRS, Drizzle, Vitest, Playwright).
- `docs/conventions/` and `docs/guides/`
- `AGENTS.md`, except its "Project" section
- the root configs: `.dependency-cruiser.cjs`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.ts`,
  `playwright*.config.ts`, `drizzle.config.ts`, `next.config.ts`, `postcss.config.mjs`, `pnpm-workspace.yaml`,
  `docker-compose.yml`, `.nvmrc`
- `scripts/checks/` (the other checks) and `scripts/db/`
- `src/shared/`, `src/ui/` (the kit), `src/app/globals.css` (tokens: restyle them per project), and optionally
  the reference slice (`src/contexts/reference-*`, `src/composition/`, `src/app/api/`, `src/app/reference/`, `e2e/`)
- `.github/workflows/deploy.yml`, if the platform is also Vercel and Neon

**3. Project-specific. Write fresh each time.**
- the "Project" section of `AGENTS.md`, `docs/domain-language.md`, `docs/contexts.md`
- `src/contexts/<your contexts>`, and your `plan/features.*` and `plan/plan.json`
- `.github/CODEOWNERS` (generate it), `.env`, repository variables and secrets

After copying, run `pnpm verify`, `pnpm prove:guardrails`, and `pnpm test:pipeline`.
