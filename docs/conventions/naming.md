# Naming

> Read this before: you create, rename, or move a file.
> Enforced by lint in `pnpm verify:fast`. Choosing names that match `docs/domain-language.md` is checked in review.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

- Files are kebab-case and end with a role suffix that matches their role:
  `.aggregate.ts`, `.entity.ts`, `.value-object.ts`, `.event.ts`, `.error.ts`,
  `.port.ts`, `.repository.ts`, `.command.ts`, `.query.ts`, `.handler.ts`,
  `.event-handler.ts`, `.dto.ts`, `.mapper.ts`, `.model.ts` (Drizzle table definitions).
  Example: `order.aggregate.ts`, `email.value-object.ts`, `confirm-order.command.ts`.
- Repository implementations are prefixed with their technology:
  `in-memory-order.repository.ts`.
- A test sits next to its file and adds `.test.ts` (`.test.tsx` for a component): `order.aggregate.test.ts`.
- Class names are the PascalCase of the file's base name, and keep the role
  where it distinguishes the class: `Order`, `Email`, `ConfirmOrderCommand`,
  `ConfirmOrderHandler`, `OrderRepository`.
- Exempt from the suffix rule: `index.ts`, everything in `src/shared/`,
  `src/composition/` and `src/ui/`, Next.js special files under `src/app/` (`page.tsx`,
  `layout.tsx`, `route.ts`, ...), and tool config files.
- UI files (`src/ui/` and `src/app/`) are kebab-case with no role suffix: `text-field.tsx`. A component
  that runs in the browser ends in `.client.tsx`: `open-loan-form.client.tsx`. Server actions live in
  `actions.ts`. See `docs/conventions/ui.md`.
- Allowed suffixes by layer (enforced by `scripts/checks/check-names.mjs`, part of `pnpm lint`):
  - `domain/`: `aggregate`, `entity`, `value-object`, `event` (only in `events/`), `error`, `repository`, `port`
  - `application/`: `command`, `query`, `handler`, `event-handler`, `dto`, `error`, `port`
    (`commands/` allows `command`, `handler`, `error`; `queries/` allows `query`, `handler`, `dto`;
    `event-handlers/` allows `event-handler`)
  - `infrastructure/`: `model`, `mapper`, `repository`, `error`
  - `testing/`: `repository`
  Only `index.ts` may sit at the root of a context.
- Choosing names that match `docs/domain-language.md` is your responsibility and is checked in review.
