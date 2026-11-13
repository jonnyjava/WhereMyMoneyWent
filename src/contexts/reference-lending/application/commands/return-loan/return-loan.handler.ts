import type { LoanAlreadyReturned } from '../../../domain/loan.error';
import type { LoanRepository } from '../../../domain/loan.repository';
import type { Clock } from '@/shared/clock';
import type { EventBus } from '@/shared/event-bus';
import { err, ok, type Result } from '@/shared/result';
import { loanNotFound, type LoanNotFound } from '../../errors/loan-not-found.error';
import type { ReturnLoanCommand } from './return-loan.command';

export type ReturnLoanError = LoanNotFound | LoanAlreadyReturned;

export class ReturnLoanHandler {
  constructor(
    private readonly loans: LoanRepository,
    private readonly events: EventBus,
    private readonly clock: Clock,
  ) {}

  async execute(command: ReturnLoanCommand): Promise<Result<void, ReturnLoanError>> {
    const loan = await this.loans.find(command.loanId);
    if (loan === null) return err(loanNotFound(command.loanId));

    const returned = loan.markReturned(this.clock());
    if (!returned.ok) return returned;

    await this.loans.save(loan);
    await this.events.publish(loan.pullEvents());
    return ok(undefined);
  }
}
