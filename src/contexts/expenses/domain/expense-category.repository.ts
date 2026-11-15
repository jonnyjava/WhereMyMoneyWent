import type { Result } from '@/shared/result';
import type { ExpenseCategoryNameAlreadyExists } from './expense-category.error';
import type { Email } from './email.value-object';
import type { ExpenseCategory } from './expense-category.aggregate';

/**
 * Port: implemented in infrastructure/ (Drizzle) and testing/ (in-memory).
 * `save` refuses a name the same owner already uses, so the rule holds for create and rename alike.
 */
export interface ExpenseCategoryRepository {
  findOwned(id: string, ownerEmail: Email): Promise<ExpenseCategory | null>;
  save(category: ExpenseCategory): Promise<Result<void, ExpenseCategoryNameAlreadyExists>>;
  /** False when no category with that id belongs to the owner. */
  deleteOwned(id: string, ownerEmail: Email): Promise<boolean>;
}