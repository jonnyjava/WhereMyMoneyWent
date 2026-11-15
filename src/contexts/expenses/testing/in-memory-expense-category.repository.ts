import { err, ok, type Result } from '@/shared/result';
import type { ExpenseCategoryDto } from '../application/dto/expense-category.dto';
import type { ExpenseCategoryReadPort } from '../application/ports/expense-category-read.port';
import { ExpenseCategory, type ExpenseCategoryProps } from '../domain/expense-category.aggregate';
import type { ExpenseCategoryNameAlreadyExists } from '../domain/expense-category.error';
import { expenseCategoryNameAlreadyExists } from '../domain/expense-category.error';
import type { ExpenseCategoryRepository } from '../domain/expense-category.repository';
import type { Email } from '../domain/email.value-object';

/** Fake for the expense-category ports. Stores snapshots, like a real database would. */
export class InMemoryExpenseCategoryRepository implements ExpenseCategoryRepository, ExpenseCategoryReadPort {
  private readonly stored = new Map<string, ExpenseCategoryProps>();

  async findOwned(id: string, ownerEmail: Email): Promise<ExpenseCategory | null> {
    const props = this.stored.get(id);
    return props && props.ownerEmail.equals(ownerEmail) ? ExpenseCategory.reconstitute(props) : null;
  }

  async save(category: ExpenseCategory): Promise<Result<void, ExpenseCategoryNameAlreadyExists>> {
    const snapshot = category.toSnapshot();
    for (const existing of this.stored.values()) {
      const sameOwner = existing.ownerEmail.equals(snapshot.ownerEmail);
      const sameName = existing.name.equals(snapshot.name);
      if (existing.id !== snapshot.id && sameOwner && sameName) {
        return err(expenseCategoryNameAlreadyExists(snapshot.name.value));
      }
    }
    this.stored.set(snapshot.id, { ...snapshot });
    return ok(undefined);
  }

  async deleteOwned(id: string, ownerEmail: Email): Promise<boolean> {
    const existing = this.stored.get(id);
    if (!existing || !existing.ownerEmail.equals(ownerEmail)) return false;
    this.stored.delete(id);
    return true;
  }

  async listByOwner(ownerEmail: Email): Promise<ExpenseCategoryDto[]> {
    return [...this.stored.values()]
      .filter((props) => props.ownerEmail.equals(ownerEmail))
      .sort((one, other) => one.createdAt.getTime() - other.createdAt.getTime())
      .map((props) => ({ id: props.id, name: props.name.value }));
  }
}