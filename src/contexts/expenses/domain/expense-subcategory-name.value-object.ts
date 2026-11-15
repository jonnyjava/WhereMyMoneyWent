import { err, ok, type Result } from '@/shared/result';
import { invalidSubcategoryName, type InvalidSubcategoryName } from './expense-subcategory.error';

const MAX_LENGTH = 80;

/**
 * The name of an expense-subcategory. Trimmed, with repeated inner whitespace collapsed, so names compare reliably.
 * The same name may appear under different expense-categories; it is unique only inside one.
 */
export class ExpenseSubcategoryName {
  private constructor(readonly value: string) {}

  static create(input: string): Result<ExpenseSubcategoryName, InvalidSubcategoryName> {
    const normalized = input.trim().replace(/\s+/g, ' ');
    if (normalized === '' || normalized.length > MAX_LENGTH) return err(invalidSubcategoryName(input));
    return ok(new ExpenseSubcategoryName(normalized));
  }

  static reconstitute(value: string): ExpenseSubcategoryName {
    return new ExpenseSubcategoryName(value);
  }

  equals(other: ExpenseSubcategoryName): boolean {
    return this.value === other.value;
  }
}