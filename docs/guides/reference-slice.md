# The reference slice

Two small contexts, `reference-lending` and `reference-stats`, plus the wiring and delivery
around them. They exist so that **the first agent task copies a reviewed pattern instead of
inventing one**. They contain no product decisions.

They are pattern examples, not product code. Copy their structure for new contexts. Never
import them, extend them, or build product features in them (dependency-cruiser enforces the
import rule). Their tables live in their own Postgres schema, `reference`.

## Where each convention appears

| Convention doc | See |
|---|---|
| `naming.md` | every file under `src/contexts/`; enforced by `scripts/checks/check-names.mjs` |
| `domain-layer.md` | `reference-lending/domain/loan.aggregate.ts` (private constructor, `create` vs `reconstitute`, invariants inside methods, no setters, events recorded), `email.value-object.ts` (immutable, validated factory, `equals`), `loan.repository.ts` (port lives in the domain), `events/` |
| `application-layer.md` | `application/commands/*` (one handler per command, one aggregate each, no business rules), `queries/get-loan` (read port, returns a DTO), constructor-injected dependencies |
| `errors.md` | `email.error.ts`, `loan.error.ts` (typed error kinds), handlers returning `Result`, exhaustive `switch` in `src/app/api/reference/http.ts` |
| `persistence.md` | `infrastructure/loan.model.ts`, `loan.mapper.ts`, `drizzle-loan.repository.ts` (one aggregate per transaction), `drizzle/` migrations, repository tests against real Postgres |
| `composition-root.md` | `src/composition/create-container.ts` (the only wiring), `container.ts` (`server-only`, cached on `globalThis`) |
| `domain-events.md` | `AggregateRoot.record`, handlers publishing after save, `InProcessEventBus`, `reference-stats/application/event-handlers/on-loan-returned.event-handler.ts` (cross-context through the public `index.ts`, idempotent) |
| `ui.md` | `src/ui/` (the kit, with component tests), `src/app/reference/loans/`: `page.tsx` (a server component reading through the container), `actions.ts` (one command per action, `FormState`, typed values given back), `messages.ts` and its test, the two `*.client.tsx` islands; `src/app/globals.css` (the tokens); `e2e/reference-ui.spec.ts` (a full flow and an axe scan) |
| `testing.md` | domain unit tests, handler tests against `testing/in-memory-*.repository.ts` (no mocks), integration tests, `create-container.test.ts` (both contexts end to end), `e2e/reference-loans.spec.ts` |

## Starting a new context
Run `pnpm new-context <name>` (it creates the layer folders, the public `index.ts` and the doc entries), or copy the folder layout of `reference-lending` by hand. Then:
1. Decide the context with a human (see "Stop and ask" in `AGENTS.md`).
2. Add its terms to `docs/domain-language.md` and its entry to `docs/contexts.md`.
3. Add the public `index.ts` (commands, queries, DTOs, error types, event types only).
4. Wire it in `src/composition/`.

## Removing the reference slice
Once real contexts show the patterns, you can delete it:
1. Delete `src/contexts/reference-*`, `src/app/api/reference/`, `src/app/reference/`, `e2e/reference-loans.spec.ts`
   and `e2e/reference-ui.spec.ts`. Keep `src/ui/`: it is the kit, not an example.
2. Remove its wiring from `src/composition/create-container.ts`, its routes' imports, and the link on the home page.
3. Drop the `reference` schema with a deliberate, human-approved migration. It is destructive,
   so the pipeline will correctly escalate it to you.
4. Delete this file, and the `reference-*` lines in `AGENTS.md` and `.dependency-cruiser.cjs`.
