import type { DomainEvent } from './domain-event';
import type { EventBus, EventHandlerFn } from './event-bus';

/**
 * In-process dispatch, after the originating command has saved. A failing
 * subscriber never rolls back or fails the command: the failure is reported
 * to `onError` (logged by default).
 */
export class InProcessEventBus implements EventBus {
  private readonly handlers = new Map<string, EventHandlerFn<DomainEvent>[]>();

  constructor(
    private readonly onError: (error: unknown, event: DomainEvent) => void = (error, event) =>
      console.error(`Subscriber failed for ${event.name}`, error),
  ) {}

  subscribe<E extends DomainEvent>(eventName: string, handler: EventHandlerFn<E>): void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(handler as EventHandlerFn<DomainEvent>);
    this.handlers.set(eventName, list);
  }

  async publish(events: readonly DomainEvent[]): Promise<void> {
    for (const event of events) {
      for (const handler of this.handlers.get(event.name) ?? []) {
        try {
          await handler(event);
        } catch (error) {
          this.onError(error, event);
        }
      }
    }
  }
}
