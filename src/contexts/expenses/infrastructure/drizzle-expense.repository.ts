import { and, asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { ExpenseDto } from '../application/dto/expense.dto';
import type { ExpenseReadPort } from '../application/ports/expense-read.port';
import type { Expense } from '../domain/expense.aggregate';
import type { ExpenseRepository } from '../domain/expense.repository';
import type { Email } from '../domain/email.value-object';
import { expenseMapper } from './expense.mapper';
import { expenses } from './expense.model';

export class DrizzleExpenseRepository implements ExpenseRepository, ExpenseReadPort {
  constructor(private readonly db: PostgresJsDatabase) {}

  async findOwned(id: string, ownerEmail: Email): Promise<Expense | null> {
    const [row] = await this.db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.ownerEmail, ownerEmail.value)));
    return row ? expenseMapper.toDomain(row) : null;
  }

  async save(expense: Expense): Promise<void> {
    const row = expenseMapper.toRow(expense);
    await this.db.insert(expenses).values(row).onConflictDoUpdate({ target: expenses.id, set: row });
  }

  async deleteOwned(id: string, ownerEmail: Email): Promise<boolean> {
    const deleted = await this.db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.ownerEmail, ownerEmail.value)))
      .returning({ id: expenses.id });
    return deleted.length > 0;
  }

  async listByOwner(ownerEmail: Email): Promise<ExpenseDto[]> {
    const rows = await this.db
      .select()
      .from(expenses)
      .where(eq(expenses.ownerEmail, ownerEmail.value))
      .orderBy(asc(expenses.spentOn), asc(expenses.createdAt), asc(expenses.id));
    return rows.map(expenseMapper.toDto);
  }
}