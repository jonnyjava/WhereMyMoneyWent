import type { DomainEvent } from './domain-event';

/** Aggregates record events; they never publish them. */
export abstract class AggregateRoot {
  private events: DomainEvent[] = [];

  protected record(event: DomainEvent): void {
    this.events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const pulled = this.events;
    this.events = [];
    return pulled;
  }
}
