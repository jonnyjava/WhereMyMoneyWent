import { ok, type Result } from '@/shared/result';
import type { InvalidSubcategoryName } from './expense-subcategory.error';
import { ExpenseSubcategoryName } from './expense-subcategory-name.value-object';

export type ExpenseSubcategoryProps = {
  id: string;
  name: ExpenseSubcategoryName;
};

/** A named detail under one expense-category, unique inside it. Part of the expense-category aggregate. */
export class ExpenseSubcategory {
  private constructor(private props: ExpenseSubcategoryProps) {}

  static create(input: { id: string; name: string }): Result<ExpenseSubcategory, InvalidSubcategoryName> {
    const name = ExpenseSubcategoryName.create(input.name);
    if (!name.ok) return name;
    return ok(new ExpenseSubcategory({ id: input.id, name: name.value }));
  }

  static reconstitute(props: ExpenseSubcategoryProps): ExpenseSubcategory {
    return new ExpenseSubcategory({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get name(): ExpenseSubcategoryName {
    return this.props.name;
  }

  /** A renamed copy: the aggregate swaps it in, so a refused rename leaves the subcategory untouched. */
  rename(name: string): Result<ExpenseSubcategory, InvalidSubcategoryName> {
    const renamed = ExpenseSubcategoryName.create(name);
    if (!renamed.ok) return renamed;
    return ok(ExpenseSubcategory.reconstitute({ id: this.props.id, name: renamed.value }));
  }

  toSnapshot(): Readonly<ExpenseSubcategoryProps> {
    return { ...this.props };
  }
}