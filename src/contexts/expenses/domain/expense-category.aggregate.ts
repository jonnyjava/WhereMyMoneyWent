import { ok, type Result } from '@/shared/result';
import type { Email } from './email.value-object';
import type { InvalidCategoryName } from './expense-category.error';
import { ExpenseCategoryName } from './expense-category-name.value-object';

export type ExpenseCategoryProps = {
  id: string;
  name: ExpenseCategoryName;
  ownerEmail: Email;
  createdAt: Date;
};

/**
 * A named grouping of expenses, owned by one user and unique among that user's categories.
 * Uniqueness spans categories, so it is enforced when the category is saved (see ExpenseCategoryRepository).
 */
export class ExpenseCategory {
  private constructor(private props: ExpenseCategoryProps) {}

  /** A new expense-category: validates its name. */
  static create(
    input: { id: string; name: string; ownerEmail: Email },
    now: Date,
  ): Result<ExpenseCategory, InvalidCategoryName> {
    const name = ExpenseCategoryName.create(input.name);
    if (!name.ok) return name;
    return ok(
      new ExpenseCategory({ id: input.id, name: name.value, ownerEmail: input.ownerEmail, createdAt: now }),
    );
  }

  /** Loads a stored expense-category: no validation. */
  static reconstitute(props: ExpenseCategoryProps): ExpenseCategory {
    return new ExpenseCategory({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get name(): ExpenseCategoryName {
    return this.props.name;
  }

  get ownerEmail(): Email {
    return this.props.ownerEmail;
  }

  toSnapshot(): Readonly<ExpenseCategoryProps> {
    return { ...this.props };
  }

  /** Renames the expense-category, validating the new name. */
  rename(name: string): Result<void, InvalidCategoryName> {
    const renamed = ExpenseCategoryName.create(name);
    if (!renamed.ok) return renamed;
    this.props.name = renamed.value;
    return ok(undefined);
  }
}