# Application layer (CQRS)

> Read this before: you write or change a command, query, or handler.
> Checked in architecture review.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

- Layout: `application/commands/<name>/{<name>.command.ts, <name>.handler.ts}`
  and `application/queries/<name>/{<name>.query.ts, <name>.handler.ts}`.
  One handler per command or query.
- Commands change state. A command handler loads one aggregate through its
  repository, calls a domain method, saves it, and dispatches the recorded
  domain events. It contains no business rules (those belong in the domain).
  It returns nothing or just an ID.
- One command modifies one aggregate. Coordinating several aggregates is
  done with domain events, not a bigger transaction.
- Queries never change state and never touch aggregates. They read through
  dedicated read ports and return plain DTOs. Never return a domain object
  from a query.
- Handlers receive their dependencies (repositories, ports) through the
  constructor. They never import from `infrastructure/`.
- Input shape validation (types, formats) happens in the delivery layer.
  Business rules are enforced in the domain.
