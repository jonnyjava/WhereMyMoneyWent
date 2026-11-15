import { err, ok, type Result } from '@/shared/result';
import { invalidCategoryName, type InvalidCategoryName } from './expense-category.error';

const MAX_LENGTH = 80;

/** The name of an expense-category. Trimmed, with repeated inner whitespace collapsed, so names compare reliably. */
export class ExpenseCategoryName {
  private constructor(readonly value: string) {}

  static create(input: string): Result<ExpenseCategoryName, InvalidCategoryName> {
    const normalized = input.trim().replace(/\s+/g, ' ');
    if (normalized === '' || normalized.length > MAX_LENGTH) return err(invalidCategoryName(input));
    return ok(new ExpenseCategoryName(normalized));
  }

  static reconstitute(value: string): ExpenseCategoryName {
    return new ExpenseCategoryName(value);
  }

  equals(other: ExpenseCategoryName): boolean {
    return this.value === other.value;
  }
}