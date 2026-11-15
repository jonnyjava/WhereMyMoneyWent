import { err, ok, type Result } from '@/shared/result';
import { invalidAmount, type InvalidAmount } from './expense-amount.error';

/**
 * A positive sum of money, in cents. Cents are used instead of a decimal so that adding up expenses
 * cannot drift. There is no currency: currencies and exchange rates are out of scope.
 */
export class ExpenseAmount {
  private constructor(readonly cents: number) {}

  static create(cents: number): Result<ExpenseAmount, InvalidAmount> {
    if (!Number.isInteger(cents) || cents <= 0) return err(invalidAmount(cents));
    return ok(new ExpenseAmount(cents));
  }

  static reconstitute(cents: number): ExpenseAmount {
    return new ExpenseAmount(cents);
  }

  equals(other: ExpenseAmount): boolean {
    return this.cents === other.cents;
  }
}