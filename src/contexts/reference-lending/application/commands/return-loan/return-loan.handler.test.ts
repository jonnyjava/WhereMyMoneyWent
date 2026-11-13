import { describe, expect, it } from 'vitest';
import type { DomainEvent } from '@/shared/domain-event';
import { InProcessEventBus } from '@/shared/in-process-event-bus';
import { InMemoryLoanRepository } from '../../../testing/in-memory-loan.repository';
import { OpenLoanHandler } from '../open-loan/open-loan.handler';
import { ReturnLoanHandler } from './return-loan.handler';

const clock = () => new Date('2026-01-01T00:00:00Z');

async function setup() {
  const loans = new InMemoryLoanRepository();
  const events = new InProcessEventBus();
  const published: DomainEvent[] = [];
  events.subscribe('LoanReturned', async (event) => void published.push(event));
  await new OpenLoanHandler(loans, events, clock).execute({
    loanId: 'loan-1',
    bookId: 'book-1',
    borrowerEmail: 'ada@example.com',
    dueDate: new Date('2026-01-15T00:00:00Z'),
  });
  return { loans, published, handler: new ReturnLoanHandler(loans, events, clock) };
}

describe('ReturnLoanHandler', () => {
  it('marks the loan returned and publishes LoanReturned after saving', async () => {
    const { loans, published, handler } = await setup();

    const result = await handler.execute({ loanId: 'loan-1' });

    expect(result.ok).toBe(true);
    expect(await loans.findDto('loan-1')).toMatchObject({ returned: true });
    expect(published.map((e) => e.name)).toEqual(['LoanReturned']);
  });

  it('publishes nothing when the return is rejected', async () => {
    const { published, handler } = await setup();
    await handler.execute({ loanId: 'loan-1' });
    published.length = 0;

    const again = await handler.execute({ loanId: 'loan-1' });

    expect(again).toEqual({ ok: false, error: { kind: 'LoanAlreadyReturned', loanId: 'loan-1' } });
    expect(published).toEqual([]);
  });
});
