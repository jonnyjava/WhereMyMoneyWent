# Dependencies and supply chain

> Read this before: you add, remove or upgrade a dependency, change a workflow, or handle anything that looks like a secret.
> Enforced by pnpm's own protections, `pnpm check:dependencies`, `pnpm check:workflows`, `pnpm check:secrets`, and the pipeline's approval step.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

A dependency is code you did not write, running with your permissions. **Adding or changing one is a decision a person approves.**

## Before you add a dependency

1. **Do you need it?** Prefer the platform (Node, the web), then a package already in `package.json`, then a few lines of your own.
2. **Say why in the pull request:** what it does, what you considered instead, why this one (is it maintained, widely used, small?), and where it is used.
3. **Install it with pnpm:** `pnpm add <name>` for the app, `pnpm add -D <name>` for tools and tests. Never edit `pnpm-lock.yaml` by hand.
4. **Registry packages only, by name and version.** No git URLs, tarballs, local paths or aliases, and no `latest` or `*`.
5. **Never approve an install script.** `pnpm-workspace.yaml` (a protected path) decides which packages may run one. If a package needs one, stop and ask.

## What happens to your pull request

- **A lockfile change runs every check, and then waits for a person.** When all checks pass, the pipeline does not merge it: it labels the pull request `awaiting-approval` and a person reviews the dependency changes and merges. `CODEOWNERS` makes that review binding (`harness/human-approval-paths.txt`).
- **pnpm refuses what looks risky.** A version published in the last 7 days (`minimumReleaseAge`), a package whose publisher evidence got weaker than its earlier releases (`trustPolicy: no-downgrade`), and a transitive dependency from git or a URL (`blockExoticSubdeps`).
  If an install fails for one of these reasons, do not work around it. Pick an older version if one exists and say so in the pull request, or stop and ask.
- **Exceptions are reviewed, listed with their reason in `pnpm-workspace.yaml`, and changed only by a person.** Today: Vercel's own packages in `trustPolicyExclude`, and the accepted audit findings in `auditConfig.ignoreGhsas`.

## Updates and audits

- **Dependabot** proposes dependency and action updates weekly (a version must be 7 days old, a major 14). A person merges them.
- **The weekly security audit** opens one issue labeled `security` for any advisory in production dependencies, and for critical or high advisories anywhere that are not on the reviewed list. It starts no agent.
- A new advisory is fixed by upgrading. Recording it in `auditConfig.ignoreGhsas` (with the reason) is allowed only for development tools, and only a person does it.

## Workflows

- **Every action is pinned to a full commit SHA** with a `# v1.2.3` comment. A tag can be moved by whoever controls the repository; a commit cannot. Dependabot updates both parts.
- **Permissions are declared at the top** of each workflow, as narrow as possible, and `write-all` is never used. There is no `pull_request_target` trigger.
- **Untrusted text reaches shell code only through `env`.** Titles, bodies, branch names and inputs are never written inside a `run:` script as `${{ ... }}`.

## Secrets

- **Never commit one:** no `.env` files (only `.env.example`), keys, tokens, or connection strings with credentials. Secrets live in GitHub, Vercel and Neon settings.
- `pnpm check:secrets` finds the common formats and reports where, never the value. A documented fake can carry `secrets:ignore` on its line.
- **If a real secret was committed, rotate it first.** It stays in git history after you delete it.
- Turn on GitHub secret scanning and push protection (`harness/SETUP.md`).

## What is enforced by what

| Rule | Enforced by |
|---|---|
| No version younger than 7 days, no trust downgrade, no git or URL transitive dependencies | pnpm, on install and against the lockfile |
| Those three settings stay on; no exotic direct dependency; every locked package has an integrity hash from the registry | `pnpm check:dependencies` |
| A dependency change is approved by a person | the pipeline's `approval` state, `CODEOWNERS`, branch protection |
| Actions pinned, permissions declared, no untrusted text in scripts | `pnpm check:workflows` |
| No committed secrets | `pnpm check:secrets`, GitHub secret scanning |
| No unreviewed advisory | the weekly security audit |

## Stop and ask

Do not guess. Label the task `needs-human` if you need a package that pnpm refuses, an install script, a dependency from outside the registry, or a change to `pnpm-workspace.yaml` or to any rule above.
