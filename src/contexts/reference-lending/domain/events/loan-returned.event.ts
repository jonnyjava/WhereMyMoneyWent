import type { DomainEvent } from '@/shared/domain-event';

export class LoanReturned implements DomainEvent {
  readonly name = 'LoanReturned';

  constructor(
    readonly loanId: string,
    readonly occurredAt: Date,
  ) {}
}
