import { err, ok, type Result } from '@/shared/result';
import { invalidExpenseDate, type InvalidExpenseDate } from './expense-date.error';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The calendar day an expense was spent on, as `YYYY-MM-DD`. A date without a time or a time zone. */
export class ExpenseDate {
  private constructor(readonly value: string) {}

  static create(input: string): Result<ExpenseDate, InvalidExpenseDate> {
    const match = ISO_DATE.exec(input.trim());
    if (match === null) return err(invalidExpenseDate(input));

    const [, year, month, day] = match;
    const value = `${year}-${month}-${day}`;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    const isRealDate = Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    return isRealDate ? ok(new ExpenseDate(value)) : err(invalidExpenseDate(input));
  }

  /** Today, in UTC: the default when an expense is registered without a date. */
  static today(now: Date): ExpenseDate {
    return new ExpenseDate(now.toISOString().slice(0, 10));
  }

  static reconstitute(value: string): ExpenseDate {
    return new ExpenseDate(value);
  }

  equals(other: ExpenseDate): boolean {
    return this.value === other.value;
  }
}