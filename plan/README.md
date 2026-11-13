# plan/

The working folder of the planning layer. The full guide is `docs/guides/planning.md`.

| File | What it is | Who writes it |
| --- | --- | --- |
| `features.md` or `features.json` | Your feature list: the input | you |
| `plan.json` | The approved plan: bounded contexts and small tasks | the planner proposes it in a pull request, you approve it by merging |
| `features.example.md`, `features.example.json`, `plan.example.json` | A small worked example of each format | shipped with the starter |

Only `plan.json` drives the pipeline. The examples are never read by a workflow; they exist so
the formats stay documented and tested.
