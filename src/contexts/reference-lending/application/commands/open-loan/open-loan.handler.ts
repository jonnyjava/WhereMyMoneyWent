import { Email } from '../../../domain/email.value-object';
import type { InvalidEmail } from '../../../domain/email.error';
import { Loan } from '../../../domain/loan.aggregate';
import type { InvalidDueDate } from '../../../domain/loan.error';
import type { LoanRepository } from '../../../domain/loan.repository';
import type { Clock } from '@/shared/clock';
import type { EventBus } from '@/shared/event-bus';
import { ok, type Result } from '@/shared/result';
import type { OpenLoanCommand } from './open-loan.command';

export type OpenLoanError = InvalidEmail | InvalidDueDate;

export class OpenLoanHandler {
  constructor(
    private readonly loans: LoanRepository,
    private readonly events: EventBus,
    private readonly clock: Clock,
  ) {}

  async execute(command: OpenLoanCommand): Promise<Result<void, OpenLoanError>> {
    const borrower = Email.create(command.borrowerEmail);
    if (!borrower.ok) return borrower;

    const loan = Loan.create(
      {
        id: command.loanId,
        bookId: command.bookId,
        borrower: borrower.value,
        dueDate: command.dueDate,
      },
      this.clock(),
    );
    if (!loan.ok) return loan;

    await this.loans.save(loan.value);
    await this.events.publish(loan.value.pullEvents());
    return ok(undefined);
  }
}
