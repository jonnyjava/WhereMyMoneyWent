import type { ExpenseDto } from '../application/dto/expense.dto';
import type { ExpenseReadPort } from '../application/ports/expense-read.port';
import { Expense, type ExpenseProps } from '../domain/expense.aggregate';
import type { ExpenseRepository } from '../domain/expense.repository';
import type { Email } from '../domain/email.value-object';

/** Fake for the expense ports. Stores snapshots, like a real database would. */
export class InMemoryExpenseRepository implements ExpenseRepository, ExpenseReadPort {
  private readonly stored = new Map<string, ExpenseProps>();

  async findOwned(id: string, ownerEmail: Email): Promise<Expense | null> {
    const props = this.stored.get(id);
    return props && props.ownerEmail.equals(ownerEmail) ? Expense.reconstitute(props) : null;
  }

  async save(expense: Expense): Promise<void> {
    this.stored.set(expense.id, expense.toSnapshot());
  }

  async deleteOwned(id: string, ownerEmail: Email): Promise<boolean> {
    const existing = this.stored.get(id);
    if (!existing || !existing.ownerEmail.equals(ownerEmail)) return false;
    this.stored.delete(id);
    return true;
  }

  async listByOwner(ownerEmail: Email): Promise<ExpenseDto[]> {
    return [...this.stored.values()]
      .filter((props) => props.ownerEmail.equals(ownerEmail))
      .sort(compare)
      .map((props) => ({
        id: props.id,
        amountCents: props.amount.cents,
        spentOn: props.spentOn.value,
        categoryId: props.target.categoryId,
        subcategoryId: props.target.kind === 'subcategory' ? props.target.subcategoryId : null,
        ownerEmail: props.ownerEmail.value,
      }));
  }
}

function compare(one: ExpenseProps, other: ExpenseProps): number {
  return (
    one.spentOn.value.localeCompare(other.spentOn.value) ||
    one.createdAt.getTime() - other.createdAt.getTime() ||
    one.id.localeCompare(other.id)
  );
}