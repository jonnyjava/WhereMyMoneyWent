import type { DomainEvent } from '@/shared/domain-event';

export class LoanExtended implements DomainEvent {
  readonly name = 'LoanExtended';

  constructor(
    readonly loanId: string,
    readonly newDueDate: Date,
    readonly occurredAt: Date,
  ) {}
}
