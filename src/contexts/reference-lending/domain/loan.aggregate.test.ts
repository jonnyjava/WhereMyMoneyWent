import { describe, expect, it } from 'vitest';
import { Email } from './email.value-object';
import { Loan } from './loan.aggregate';

const now = new Date('2026-01-01T00:00:00Z');
const inDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

function openLoan(dueInDays = 14): Loan {
  const created = Loan.create(
    {
      id: 'loan-1',
      bookId: 'book-1',
      borrower: Email.reconstitute('ada@example.com'),
      dueDate: inDays(dueInDays),
    },
    now,
  );
  if (!created.ok) throw new Error('fixture must be valid');
  return created.value;
}

describe('Loan', () => {
  describe('create', () => {
    it('rejects a due date that is not in the future', () => {
      const result = Loan.create(
        { id: 'l', bookId: 'b', borrower: Email.reconstitute('a@b.co'), dueDate: now },
        now,
      );
      expect(result).toEqual({ ok: false, error: { kind: 'InvalidDueDate' } });
    });
  });

  describe('extend', () => {
    it('moves the due date and records LoanExtended', () => {
      const loan = openLoan(14);

      expect(loan.extend(7, now).ok).toBe(true);

      expect(loan.toSnapshot().dueDate).toEqual(inDays(21));
      expect(loan.pullEvents().map((e) => e.name)).toEqual(['LoanExtended']);
    });

    it('rejects a second extension', () => {
      const loan = openLoan();
      loan.extend(7, now);

      expect(loan.extend(7, now)).toEqual({
        ok: false,
        error: { kind: 'ExtensionLimitReached', loanId: 'loan-1', limit: 1 },
      });
    });

    it('rejects extending a returned loan', () => {
      const loan = openLoan();
      loan.markReturned(now);

      expect(loan.extend(7, now)).toEqual({
        ok: false,
        error: { kind: 'LoanAlreadyReturned', loanId: 'loan-1' },
      });
    });
  });

  describe('markReturned', () => {
    it('records LoanReturned', () => {
      const loan = openLoan();

      expect(loan.markReturned(now).ok).toBe(true);

      expect(loan.pullEvents().map((e) => e.name)).toEqual(['LoanReturned']);
    });

    it('rejects returning twice', () => {
      const loan = openLoan();
      loan.markReturned(now);

      expect(loan.markReturned(now)).toEqual({
        ok: false,
        error: { kind: 'LoanAlreadyReturned', loanId: 'loan-1' },
      });
    });
  });

  it('records no events when reconstituted from storage', () => {
    const loan = Loan.reconstitute(openLoan().toSnapshot());
    expect(loan.pullEvents()).toEqual([]);
  });
});
