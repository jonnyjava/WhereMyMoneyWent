// Public API of the context. Only commands, queries, DTOs, error types and
// event types are exported: never aggregates, entities, value objects or repositories.
export type { OpenLoanCommand } from './application/commands/open-loan/open-loan.command';
export type { OpenLoanError } from './application/commands/open-loan/open-loan.handler';
export type { ExtendLoanCommand } from './application/commands/extend-loan/extend-loan.command';
export type { ExtendLoanError } from './application/commands/extend-loan/extend-loan.handler';
export type { ReturnLoanCommand } from './application/commands/return-loan/return-loan.command';
export type { ReturnLoanError } from './application/commands/return-loan/return-loan.handler';
export type { GetLoanQuery } from './application/queries/get-loan/get-loan.query';
export type { LoanDto } from './application/dto/loan.dto';
export type { LoanNotFound } from './application/errors/loan-not-found.error';
export type { InvalidEmail } from './domain/email.error';
export type {
  ExtensionLimitReached,
  InvalidDueDate,
  LoanAlreadyReturned,
} from './domain/loan.error';
export { LoanExtended } from './domain/events/loan-extended.event';
export { LoanReturned } from './domain/events/loan-returned.event';
