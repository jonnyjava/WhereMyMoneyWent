import type { LoanReturned } from '@/contexts/reference-lending';
import type { RecordReturnHandler } from '../commands/record-return/record-return.handler';

/** Subscriber: idempotent, because RecordReturn ignores a loan it has already counted. */
export class OnLoanReturnedHandler {
  static readonly EVENT_NAME = 'LoanReturned';

  constructor(private readonly recordReturn: RecordReturnHandler) {}

  async handle(event: LoanReturned): Promise<void> {
    await this.recordReturn.execute({ loanId: event.loanId });
  }
}
