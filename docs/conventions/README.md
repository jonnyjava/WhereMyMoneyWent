# Conventions profile: ddd-nextjs

How code is written in a Next.js project built with DDD, CQRS handlers,
`Result`-based errors, Drizzle on Postgres, and Vitest + Playwright.

These files are meant to be copied unchanged between projects that share this
stack. They are loaded on demand: `AGENTS.md` lists when to read each one, and
the architecture reviewer and QA gate read the ones relevant to a PR every time.

Rules for editing them:
- Put project-specific facts (product description, bounded contexts, domain
  terms) in `AGENTS.md` and `docs/domain-language.md`, never here.
- Agents may not edit these files (see `harness/protected-paths.txt`). Improve
  them deliberately, in one place, then copy the change to other projects.
