import type { Email } from '../../domain/email.value-object';
import type { ExpenseCategoryDto } from '../dto/expense-category.dto';
import type { ExpenseSubcategoryDto } from '../dto/expense-subcategory.dto';

/** Read port for queries: reads straight from storage, bypassing aggregates. */
export interface ExpenseCategoryReadPort {
  listByOwner(ownerEmail: Email): Promise<ExpenseCategoryDto[]>;
  /** Null when no expense-category with that id belongs to the owner. */
  listSubcategories(categoryId: string, ownerEmail: Email): Promise<ExpenseSubcategoryDto[] | null>;
}