# Domain layer

> Read this before: you write or change domain code (aggregates, entities, value objects, repositories' interfaces).
> Layer imports are enforced by dependency-cruiser. The rest is checked in architecture review.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

- Entities and aggregates are classes. Constructors are private. Create new
  ones with a static `create(...)` (validates, may record events) and load
  existing ones with `reconstitute(...)` (no validation, no events).
- Enforce invariants inside the aggregate. No public setters. State changes
  go through methods named in domain language (`order.confirm()`, never
  `order.status = "confirmed"`).
- Value objects are immutable classes with validation in their factory and
  an `equals` method. Use them instead of primitives for domain concepts
  (`Email`, `Money`), not `string` or `number`.
- Aggregates reference other aggregates by ID only, never by object.
- One repository per aggregate root. The interface lives in `domain/`,
  implementations live in `infrastructure/`.
- Aggregates record domain events; they don't publish them.
- Domain code imports no frameworks, ORMs, or library decorators. Persistence
  models (Drizzle table definitions) live in `infrastructure/` and are mapped
  to and from the domain by mappers.
