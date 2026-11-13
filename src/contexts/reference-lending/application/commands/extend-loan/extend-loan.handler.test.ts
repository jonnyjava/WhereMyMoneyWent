import { describe, expect, it } from 'vitest';
import { InProcessEventBus } from '@/shared/in-process-event-bus';
import { InMemoryLoanRepository } from '../../../testing/in-memory-loan.repository';
import { OpenLoanHandler } from '../open-loan/open-loan.handler';
import { ExtendLoanHandler } from './extend-loan.handler';

const clock = () => new Date('2026-01-01T00:00:00Z');

async function setup() {
  const loans = new InMemoryLoanRepository();
  const events = new InProcessEventBus();
  await new OpenLoanHandler(loans, events, clock).execute({
    loanId: 'loan-1',
    bookId: 'book-1',
    borrowerEmail: 'ada@example.com',
    dueDate: new Date('2026-01-15T00:00:00Z'),
  });
  return { loans, handler: new ExtendLoanHandler(loans, events, clock) };
}

describe('ExtendLoanHandler', () => {
  it('extends the loan', async () => {
    const { loans, handler } = await setup();

    const result = await handler.execute({ loanId: 'loan-1', days: 7 });

    expect(result.ok).toBe(true);
    expect(await loans.findDto('loan-1')).toMatchObject({
      dueDate: '2026-01-22T00:00:00.000Z',
      extensions: 1,
    });
  });

  it('reports an unknown loan', async () => {
    const { handler } = await setup();

    expect(await handler.execute({ loanId: 'missing', days: 7 })).toEqual({
      ok: false,
      error: { kind: 'LoanNotFound', loanId: 'missing' },
    });
  });

  it('surfaces the domain error when the limit is reached', async () => {
    const { handler } = await setup();
    await handler.execute({ loanId: 'loan-1', days: 7 });

    const second = await handler.execute({ loanId: 'loan-1', days: 7 });

    expect(second).toEqual({
      ok: false,
      error: { kind: 'ExtensionLimitReached', loanId: 'loan-1', limit: 1 },
    });
  });
});
