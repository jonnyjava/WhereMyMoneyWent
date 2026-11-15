import { err, ok, type Result } from '@/shared/result';
import type { Email } from './email.value-object';
import type { ExpenseCategoryHasSubcategories, InvalidCategoryName } from './expense-category.error';
import { expenseCategoryHasSubcategories } from './expense-category.error';
import { ExpenseCategoryName } from './expense-category-name.value-object';
import { ExpenseSubcategory } from './expense-subcategory.entity';
import type { ExpenseTarget } from './expense-target.value-object';
import type {
  ExpenseSubcategoryNotFound,
  InvalidSubcategoryName,
  SubcategoryNameAlreadyExists,
} from './expense-subcategory.error';
import { expenseSubcategoryNameAlreadyExists, expenseSubcategoryNotFound } from './expense-subcategory.error';

export type ExpenseCategoryProps = {
  id: string;
  name: ExpenseCategoryName;
  ownerEmail: Email;
  createdAt: Date;
  subcategories: ExpenseSubcategory[];
};

/**
 * A named grouping of expenses, owned by one user and unique among that user's categories.
 * Uniqueness across categories is enforced when the category is saved (see ExpenseCategoryRepository).
 * The expense-subcategories of the category are part of this aggregate, so deleting the category
 * deletes them with it.
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
      new ExpenseCategory({
        id: input.id,
        name: name.value,
        ownerEmail: input.ownerEmail,
        createdAt: now,
        subcategories: [],
      }),
    );
  }

  /** Loads a stored expense-category: no validation. */
  static reconstitute(props: ExpenseCategoryProps): ExpenseCategory {
    return new ExpenseCategory({ ...props, subcategories: [...props.subcategories] });
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

  get subcategories(): readonly ExpenseSubcategory[] {
    return this.props.subcategories;
  }

  toSnapshot(): Readonly<ExpenseCategoryProps> {
    return { ...this.props, subcategories: [...this.props.subcategories] };
  }

  /** Renames the expense-category, validating the new name. */
  rename(name: string): Result<void, InvalidCategoryName> {
    const renamed = ExpenseCategoryName.create(name);
    if (!renamed.ok) return renamed;
    this.props.name = renamed.value;
    return ok(undefined);
  }

  hasSubcategories(): boolean {
    return this.props.subcategories.length > 0;
  }

  /** Adds an expense-subcategory, refusing a name another subcategory of this category already uses. */
  addSubcategory(
    input: { id: string; name: string },
  ): Result<ExpenseSubcategory, InvalidSubcategoryName | SubcategoryNameAlreadyExists> {
    if (this.props.subcategories.some((subcategory) => subcategory.id === input.id)) {
      // Impossible: ids are generated for each new subcategory. A collision means a bug, not a business rule.
      throw new Error(`Expense-subcategory id "${input.id}" already exists in expense-category "${this.props.id}"`);
    }
    const subcategory = ExpenseSubcategory.create(input);
    if (!subcategory.ok) return subcategory;

    const taken = this.props.subcategories.some((existing) => existing.name.equals(subcategory.value.name));
    if (taken) return err(expenseSubcategoryNameAlreadyExists(input.name));

    this.props.subcategories = [...this.props.subcategories, subcategory.value];
    return subcategory;
  }

  /** Renames an expense-subcategory, refusing a name another subcategory of this category already uses. */
  renameSubcategory(
    subcategoryId: string,
    name: string,
  ): Result<void, ExpenseSubcategoryNotFound | InvalidSubcategoryName | SubcategoryNameAlreadyExists> {
    const current = this.props.subcategories.find((subcategory) => subcategory.id === subcategoryId);
    if (current === undefined) return err(expenseSubcategoryNotFound(subcategoryId));

    const renamed = current.rename(name);
    if (!renamed.ok) return renamed;

    const taken = this.props.subcategories.some(
      (subcategory) => subcategory.id !== subcategoryId && subcategory.name.equals(renamed.value.name),
    );
    if (taken) return err(expenseSubcategoryNameAlreadyExists(name));

    this.props.subcategories = this.props.subcategories.map((subcategory) =>
      subcategory.id === subcategoryId ? renamed.value : subcategory,
    );
    return ok(undefined);
  }

  /**
   * Checks that this expense-category can be the target of an expense: a subcategory target must
   * name one of its expense-subcategories, and a direct target is refused while the category still
   * has expense-subcategories.
   */
  validateTarget(
    target: ExpenseTarget,
  ): Result<void, ExpenseCategoryHasSubcategories | ExpenseSubcategoryNotFound> {
    if (target.kind === 'subcategory') {
      const known = this.props.subcategories.some((subcategory) => subcategory.id === target.subcategoryId);
      return known ? ok(undefined) : err(expenseSubcategoryNotFound(target.subcategoryId));
    }
    if (this.props.subcategories.length > 0) return err(expenseCategoryHasSubcategories(this.props.id));
    return ok(undefined);
  }

  /** Removes an expense-subcategory. */
  removeSubcategory(subcategoryId: string): Result<void, ExpenseSubcategoryNotFound> {
    const remaining = this.props.subcategories.filter((subcategory) => subcategory.id !== subcategoryId);
    if (remaining.length === this.props.subcategories.length) return err(expenseSubcategoryNotFound(subcategoryId));
    this.props.subcategories = remaining;
    return ok(undefined);
  }
}