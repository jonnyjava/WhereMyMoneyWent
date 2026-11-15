import type { Email } from './email.value-object';
import type { Expense } from './expense.aggregate';

/** Port: implemented in infrastructure/ (Drizzle) and testing/ (in-memory). */
export interface ExpenseRepository {
  findOwned(id: string, ownerEmail: Email): Promise<Expense | null>;
  save(expense: Expense): Promise<void>;
  /** False when no expense with that id belongs to the owner. */
  deleteOwned(id: string, ownerEmail: Email): Promise<boolean>;
}