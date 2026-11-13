import { describe, expect, it } from 'vitest';
import { LoanReturned } from '@/contexts/reference-lending';
import { InMemoryReturnCounterRepository } from '../../testing/in-memory-return-counter.repository';
import { RecordReturnHandler } from '../commands/record-return/record-return.handler';
import { OnLoanReturnedHandler } from './on-loan-returned.event-handler';

describe('OnLoanReturnedHandler', () => {
  it('counts a returned loan', async () => {
    const counters = new InMemoryReturnCounterRepository();
    const handler = new OnLoanReturnedHandler(new RecordReturnHandler(counters));

    await handler.handle(new LoanReturned('loan-1', new Date('2026-01-01T00:00:00Z')));

    expect(await counters.readCount()).toBe(1);
  });

  it('is idempotent: receiving the same event twice counts once', async () => {
    const counters = new InMemoryReturnCounterRepository();
    const handler = new OnLoanReturnedHandler(new RecordReturnHandler(counters));
    const event = new LoanReturned('loan-1', new Date('2026-01-01T00:00:00Z'));

    await handler.handle(event);
    await handler.handle(event);

    expect(await counters.readCount()).toBe(1);
  });
});
