import { AggregateRoot } from '@/shared/aggregate-root';
import { err, ok, type Result } from '@/shared/result';
import type { Email } from './email.value-object';
import { LoanExtended } from './events/loan-extended.event';
import { LoanReturned } from './events/loan-returned.event';
import {
  extensionLimitReached,
  invalidDueDate,
  loanAlreadyReturned,
  type ExtensionLimitReached,
  type InvalidDueDate,
  type LoanAlreadyReturned,
} from './loan.error';

export type LoanProps = {
  id: string;
  bookId: string;
  borrower: Email;
  dueDate: Date;
  extensions: number;
  returnedAt: Date | null;
};

const MAX_EXTENSIONS = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

export class Loan extends AggregateRoot {
  private constructor(private props: LoanProps) {
    super();
  }

  /** A new loan: validates its invariants. */
  static create(
    input: { id: string; bookId: string; borrower: Email; dueDate: Date },
    now: Date,
  ): Result<Loan, InvalidDueDate> {
    if (input.dueDate.getTime() <= now.getTime()) return err(invalidDueDate());
    return ok(new Loan({ ...input, extensions: 0, returnedAt: null }));
  }

  /** Loads a stored loan: no validation, no events. */
  static reconstitute(props: LoanProps): Loan {
    return new Loan({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  toSnapshot(): Readonly<LoanProps> {
    return { ...this.props };
  }

  extend(days: number, now: Date): Result<void, LoanAlreadyReturned | ExtensionLimitReached> {
    if (this.props.returnedAt !== null) return err(loanAlreadyReturned(this.props.id));
    if (this.props.extensions >= MAX_EXTENSIONS) {
      return err(extensionLimitReached(this.props.id, MAX_EXTENSIONS));
    }
    this.props.dueDate = new Date(this.props.dueDate.getTime() + days * DAY_MS);
    this.props.extensions += 1;
    this.record(new LoanExtended(this.props.id, this.props.dueDate, now));
    return ok(undefined);
  }

  markReturned(now: Date): Result<void, LoanAlreadyReturned> {
    if (this.props.returnedAt !== null) return err(loanAlreadyReturned(this.props.id));
    this.props.returnedAt = now;
    this.record(new LoanReturned(this.props.id, now));
    return ok(undefined);
  }
}
