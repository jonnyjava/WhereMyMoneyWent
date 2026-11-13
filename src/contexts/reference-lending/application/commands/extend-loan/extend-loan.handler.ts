import type { ExtensionLimitReached, LoanAlreadyReturned } from '../../../domain/loan.error';
import type { LoanRepository } from '../../../domain/loan.repository';
import type { Clock } from '@/shared/clock';
import type { EventBus } from '@/shared/event-bus';
import { err, ok, type Result } from '@/shared/result';
import { loanNotFound, type LoanNotFound } from '../../errors/loan-not-found.error';
import type { ExtendLoanCommand } from './extend-loan.command';

export type ExtendLoanError = LoanNotFound | LoanAlreadyReturned | ExtensionLimitReached;

export class ExtendLoanHandler {
  constructor(
    private readonly loans: LoanRepository,
    private readonly events: EventBus,
    private readonly clock: Clock,
  ) {}

  async execute(command: ExtendLoanCommand): Promise<Result<void, ExtendLoanError>> {
    const loan = await this.loans.find(command.loanId);
    if (loan === null) return err(loanNotFound(command.loanId));

    const extended = loan.extend(command.days, this.clock());
    if (!extended.ok) return extended;

    await this.loans.save(loan);
    await this.events.publish(loan.pullEvents());
    return ok(undefined);
  }
}
