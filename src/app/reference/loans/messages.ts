import type { ExtendLoanError, OpenLoanError, ReturnLoanError } from '@/contexts/reference-lending';
import { assertNever } from '@/shared/assert-never';

// What a person reads when something goes wrong. Every error kind must be handled:
// adding one to the context fails the typechecker here until its message is written.
// Say what happened and what to do next, in plain words. Never show the error object.

export function openLoanMessage(error: OpenLoanError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return 'That email address does not look right. Check it and try again.';
    case 'InvalidDueDate':
      return 'The loan must end in the future. Enter 1 day or more.';
    default:
      return assertNever(error);
  }
}

export function extendLoanMessage(error: ExtendLoanError): string {
  switch (error.kind) {
    case 'LoanNotFound':
      return loanNotFoundMessage();
    case 'LoanAlreadyReturned':
      return 'This loan has already been returned, so it cannot be extended.';
    case 'ExtensionLimitReached':
      return 'This loan has already been extended once, which is the limit.';
    default:
      return assertNever(error);
  }
}

export function returnLoanMessage(error: ReturnLoanError): string {
  switch (error.kind) {
    case 'LoanNotFound':
      return loanNotFoundMessage();
    case 'LoanAlreadyReturned':
      return 'This loan has already been returned.';
    default:
      return assertNever(error);
  }
}

// A single possible failure: there is no union to be exhaustive over, so this is a plain function.
export function loanNotFoundMessage(): string {
  return 'No loan found with that id. Check the id and try again.';
}
