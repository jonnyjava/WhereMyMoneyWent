# Docs

| Folder or file | What it is | Reusable across projects? |
|---|---|---|
| `conventions/` | how code is written, one file per topic; agents read the relevant one before writing code | yes (same stack) |
| `guides/` | `bootstrap.md` (the build order), `reference-slice.md` (where each convention appears in code) and `planning.md` (from a feature list to released tasks) | yes (same stack) |
| `domain-language.md` | the project's words, per bounded context | no, project-specific |
| `contexts.md` | the bounded contexts and how they relate | no, project-specific |

`conventions/` is a protected path (agents cannot edit the rules they follow). The two
project-specific files are not: agents may add proposed terms to `domain-language.md`.
