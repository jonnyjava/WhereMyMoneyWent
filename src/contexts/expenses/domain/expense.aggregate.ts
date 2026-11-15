import { ok, type Result } from '@/shared/result';
import { ExpenseAmount } from './expense-amount.value-object';
import type { InvalidAmount } from './expense-amount.error';
import { ExpenseDate } from './expense-date.value-object';
import type { InvalidExpenseDate } from './expense-date.error';
import type { Email } from './email.value-object';
import type { ExpenseTarget } from './expense-target.value-object';

export type ExpenseProps = {
  id: string;
  amount: ExpenseAmount;
  spentOn: ExpenseDate;
  target: ExpenseTarget;
  ownerEmail: Email;
  createdAt: Date;
};

/** An amount spent on a date, attributed to an expense-category or one of its expense-subcategories. */
export class Expense {
  private constructor(private props: ExpenseProps) {}

  /**
   * A new expense. The amount must be positive and the date defaults to today. The target itself is
   * checked against the category by the caller, which owns the category.
   */
  static create(
    input: { id: string; amountCents: number; spentOn?: string; target: ExpenseTarget; ownerEmail: Email },
    now: Date,
  ): Result<Expense, InvalidAmount | InvalidExpenseDate> {
    const amount = ExpenseAmount.create(input.amountCents);
    if (!amount.ok) return amount;

    const spentOn = resolveDate(input.spentOn, now);
    if (!spentOn.ok) return spentOn;

    return ok(
      new Expense({
        id: input.id,
        amount: amount.value,
        spentOn: spentOn.value,
        target: input.target,
        ownerEmail: input.ownerEmail,
        createdAt: now,
      }),
    );
  }

  /** Loads a stored expense: no validation. */
  static reconstitute(props: ExpenseProps): Expense {
    return new Expense({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get amount(): ExpenseAmount {
    return this.props.amount;
  }

  get spentOn(): ExpenseDate {
    return this.props.spentOn;
  }

  get target(): ExpenseTarget {
    return this.props.target;
  }

  get ownerEmail(): Email {
    return this.props.ownerEmail;
  }

  toSnapshot(): Readonly<ExpenseProps> {
    return { ...this.props };
  }

  /** Changes the amount, the date and the target. The date defaults to today when it is omitted. */
  edit(
    input: { amountCents: number; spentOn?: string; target: ExpenseTarget },
    now: Date,
  ): Result<void, InvalidAmount | InvalidExpenseDate> {
    const amount = ExpenseAmount.create(input.amountCents);
    if (!amount.ok) return amount;

    const spentOn = resolveDate(input.spentOn, now);
    if (!spentOn.ok) return spentOn;

    this.props = { ...this.props, amount: amount.value, spentOn: spentOn.value, target: input.target };
    return ok(undefined);
  }
}

function resolveDate(input: string | undefined, now: Date): Result<ExpenseDate, InvalidExpenseDate> {
  return input === undefined || input.trim() === '' ? ok(ExpenseDate.today(now)) : ExpenseDate.create(input);
}