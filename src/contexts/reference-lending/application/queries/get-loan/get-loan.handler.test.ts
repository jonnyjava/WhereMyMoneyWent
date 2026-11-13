import { describe, expect, it } from 'vitest';
import { InProcessEventBus } from '@/shared/in-process-event-bus';
import { InMemoryLoanRepository } from '../../../testing/in-memory-loan.repository';
import { OpenLoanHandler } from '../../commands/open-loan/open-loan.handler';
import { GetLoanHandler } from './get-loan.handler';

describe('GetLoanHandler', () => {
  it('returns a plain DTO, not a domain object', async () => {
    const loans = new InMemoryLoanRepository();
    await new OpenLoanHandler(loans, new InProcessEventBus(), () => new Date('2026-01-01T00:00:00Z')).execute({
      loanId: 'loan-1',
      bookId: 'book-1',
      borrowerEmail: 'ada@example.com',
      dueDate: new Date('2026-01-15T00:00:00Z'),
    });

    const result = await new GetLoanHandler(loans).execute({ loanId: 'loan-1' });

    expect(result).toEqual({
      ok: true,
      value: {
        id: 'loan-1',
        bookId: 'book-1',
        borrowerEmail: 'ada@example.com',
        dueDate: '2026-01-15T00:00:00.000Z',
        extensions: 0,
        returned: false,
      },
    });
  });

  it('reports an unknown loan', async () => {
    const result = await new GetLoanHandler(new InMemoryLoanRepository()).execute({ loanId: 'x' });
    expect(result).toEqual({ ok: false, error: { kind: 'LoanNotFound', loanId: 'x' } });
  });
});
