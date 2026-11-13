import { describe, expect, it } from 'vitest';
import { InMemoryReturnCounterRepository } from '../../../testing/in-memory-return-counter.repository';
import { RecordReturnHandler } from '../../commands/record-return/record-return.handler';
import { GetReturnCountHandler } from './get-return-count.handler';

describe('GetReturnCountHandler', () => {
  it('is zero before any return', async () => {
    const counters = new InMemoryReturnCounterRepository();
    expect(await new GetReturnCountHandler(counters).execute({})).toBe(0);
  });

  it('reflects recorded returns', async () => {
    const counters = new InMemoryReturnCounterRepository();
    await new RecordReturnHandler(counters).execute({ loanId: 'loan-1' });
    expect(await new GetReturnCountHandler(counters).execute({})).toBe(1);
  });
});
