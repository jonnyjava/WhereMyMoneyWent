import { describe, expect, it } from 'vitest';
import { extendLoanMessage, loanNotFoundMessage, openLoanMessage, returnLoanMessage } from './messages';

describe('error messages', () => {
  it('every failure of opening a loan has a plain message', () => {
    expect(openLoanMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(openLoanMessage({ kind: 'InvalidDueDate' })).toMatch(/future/);
  });

  it('every failure of extending a loan has a plain message', () => {
    expect(extendLoanMessage({ kind: 'LoanNotFound', loanId: 'x' })).toMatch(/No loan found/);
    expect(extendLoanMessage({ kind: 'LoanAlreadyReturned', loanId: 'x' })).toMatch(/already been returned/);
    expect(extendLoanMessage({ kind: 'ExtensionLimitReached', loanId: 'x', limit: 1 })).toMatch(/already been extended once/);
  });

  it('every failure of returning a loan has a plain message', () => {
    expect(returnLoanMessage({ kind: 'LoanNotFound', loanId: 'x' })).toMatch(/No loan found/);
    expect(returnLoanMessage({ kind: 'LoanAlreadyReturned', loanId: 'x' })).toMatch(/already been returned/);
  });

  it('never shows internals: no ids, no braces, no error kinds', () => {
    const all = [
      openLoanMessage({ kind: 'InvalidEmail', input: 'secret@x' }),
      extendLoanMessage({ kind: 'ExtensionLimitReached', loanId: 'abc-123', limit: 1 }),
      returnLoanMessage({ kind: 'LoanAlreadyReturned', loanId: 'abc-123' }),
      loanNotFoundMessage(),
    ];
    for (const message of all) {
      expect(message).not.toMatch(/abc-123|secret@x|[{}]|LoanAlreadyReturned|ExtensionLimitReached|InvalidEmail/);
    }
  });
});
