# Composition root

> Read this before: you wire handlers or repositories together, or expose a handler to a route or server action.
> Import rules are enforced by dependency-cruiser.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

- All wiring lives in `src/composition/`: plain factory functions that build
  repositories, handlers, and the event bus. No DI container, no decorators.
- The delivery layer gets handlers only from `src/composition/`. It never
  constructs repositories or imports `infrastructure/` itself.
- Composition modules start with `import "server-only"`.
- Stateful singletons (DB client, event bus) are cached on `globalThis`, so
  Next.js hot reload doesn't create duplicates in development.
