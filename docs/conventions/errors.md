# Errors

> Read this before: you write code that can fail, or handle an error in the delivery layer.
> Exhaustive handling is enforced by the typechecker. The rest is checked in architecture review.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

- Expected failures are returned, not thrown. Domain methods, value object
  factories (`create`), and command handlers return `Result<T, E>`.
- Use the single `Result` type from `src/shared/result.ts`. Do not add a
  second Result implementation or library.
- Error types are named in domain language and defined next to the code that
  produces them (e.g. `OrderAlreadyConfirmed`), as discriminated unions or
  classes with a `kind` field.
- `throw` is only for bugs and unexpected failures (impossible states,
  infrastructure outages). Never throw for a business rule.
- Infrastructure converts library exceptions at its boundary: expected cases
  (e.g. unique-constraint violation) become error values; unexpected ones propagate.
- The delivery layer handles every error kind explicitly (exhaustive `switch`)
  and maps it to a response. Never ignore or discard an error value.
