import { describe, expect, it } from 'vitest';
import type { DomainEvent } from './domain-event';
import { InProcessEventBus } from './in-process-event-bus';

const event = (name: string): DomainEvent => ({ name, occurredAt: new Date('2026-01-01T00:00:00Z') });

describe('InProcessEventBus', () => {
  it('delivers an event to every subscriber of its name', async () => {
    const bus = new InProcessEventBus();
    const seen: string[] = [];
    bus.subscribe('A', async () => void seen.push('first'));
    bus.subscribe('A', async () => void seen.push('second'));
    bus.subscribe('B', async () => void seen.push('other'));

    await bus.publish([event('A')]);

    expect(seen).toEqual(['first', 'second']);
  });

  it('reports a failing subscriber without failing the publisher or skipping the others', async () => {
    const failures: unknown[] = [];
    const bus = new InProcessEventBus((error) => failures.push(error));
    const seen: string[] = [];
    bus.subscribe('A', async () => {
      throw new Error('boom');
    });
    bus.subscribe('A', async () => void seen.push('still runs'));

    await expect(bus.publish([event('A')])).resolves.toBeUndefined();

    expect(failures).toHaveLength(1);
    expect(seen).toEqual(['still runs']);
  });
});
