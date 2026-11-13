import { describe, expect, it } from 'vitest';
import { InProcessEventBus } from '@/shared/in-process-event-bus';
import { InMemoryLoanRepository } from '../../../testing/in-memory-loan.repository';
import { OpenLoanHandler } from './open-loan.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;
const command = {
  loanId: 'loan-1',
  bookId: 'book-1',
  borrowerEmail: 'ada@example.com',
  dueDate: new Date('2026-01-15T00:00:00Z'),
};

describe('OpenLoanHandler', () => {
  it('stores the new loan', async () => {
    const loans = new InMemoryLoanRepository();
    const handler = new OpenLoanHandler(loans, new InProcessEventBus(), clock);

    const result = await handler.execute(command);

    expect(result.ok).toBe(true);
    expect(await loans.findDto('loan-1')).toMatchObject({ bookId: 'book-1', returned: false });
  });

  it('rejects an invalid email without storing anything', async () => {
    const loans = new InMemoryLoanRepository();
    const handler = new OpenLoanHandler(loans, new InProcessEventBus(), clock);

    const result = await handler.execute({ ...command, borrowerEmail: 'nope' });

    expect(result).toEqual({ ok: false, error: { kind: 'InvalidEmail', input: 'nope' } });
    expect(await loans.findDto('loan-1')).toBeNull();
  });

  it('rejects a due date in the past', async () => {
    const handler = new OpenLoanHandler(new InMemoryLoanRepository(), new InProcessEventBus(), clock);

    const result = await handler.execute({ ...command, dueDate: new Date('2025-12-01T00:00:00Z') });

    expect(result).toEqual({ ok: false, error: { kind: 'InvalidDueDate' } });
  });
});
