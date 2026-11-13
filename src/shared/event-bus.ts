import type { DomainEvent } from './domain-event';

export type EventHandlerFn<E extends DomainEvent> = (event: E) => Promise<void>;

export interface EventBus {
  publish(events: readonly DomainEvent[]): Promise<void>;
  subscribe<E extends DomainEvent>(eventName: string, handler: EventHandlerFn<E>): void;
}
