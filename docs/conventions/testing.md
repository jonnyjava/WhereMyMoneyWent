# Testing

> Read this before: you write or change tests.
> Checked by the QA gate.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

- Test what each layer is responsible for:
  - `domain/`: unit tests on aggregates and value objects. No fakes, no I/O.
    Assert behavior and returned errors, not internals.
  - `application/`: test each handler against in-memory fakes of its ports.
  - `infrastructure/`: integration tests against the real technology
    (real database, not a mock of it).
  - `e2e/` (Playwright): critical user flows only. Business rules are tested
    at the lower levels, not through the browser.
- Do not mock our own code (`vi.mock`, spies on our classes). Implement the
  port as an in-memory fake in `src/contexts/<context>/testing/` instead.
- Tests are colocated with the code: `order.aggregate.ts` / `order.aggregate.test.ts`.
- Name tests by behavior in domain language
  ("rejects confirming an already confirmed order").
- Every new behavior ships with tests. Every bug fix starts with a failing
  regression test.
- Skipping, focusing or stubbing tests (`it.skip`, `it.only`, `it.todo`, `test.fixme`, `xit`)
  is blocked by lint. Integration tests need `DATABASE_URL` and FAIL when the database is
  unreachable. They never skip.
- Never edit an existing test just to make it pass. Change it only when the
  requirement changed, and say so in the PR description.

## UI tests
Component tests (Vitest and Testing Library in jsdom), the error-message tests, and the Playwright flows with an
axe scan have their own rules in `docs/conventions/ui.md` (Testing). They follow the rules above too: no mocking of
our own code, and a test that cannot fail does not count.
