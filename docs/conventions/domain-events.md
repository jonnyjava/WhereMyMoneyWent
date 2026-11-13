# Domain events

> Read this before: you raise, dispatch, or react to a domain event.
> Checked in architecture review.
> Part of the reusable `ddd-nextjs` conventions profile. Keep project-specific facts out of this file.

- Events are immutable classes named in the past tense, in domain language
  (`OrderConfirmed`), defined in the producing context's `domain/events/`.
- Aggregates record events (`this.record(...)`). The command handler saves the
  aggregate first, then dispatches the recorded events through the `EventBus` port.
- Dispatch is in-process and after a successful save. Subscribers run
  separately from the originating command: a failing subscriber never rolls
  back the command; it is logged and surfaced.
- To react to another context, add a handler in your own context's
  `application/event-handlers/`. Import only the event types the producer
  exports from its public `index.ts`. The handler issues a command in its
  own context; it never reads or writes the other context's repositories.
- Subscribers must be idempotent (safe to receive the same event twice).
