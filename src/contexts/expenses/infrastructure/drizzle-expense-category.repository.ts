import { and, asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { err, ok, type Result } from '@/shared/result';
import type { ExpenseCategoryDto } from '../application/dto/expense-category.dto';
import type { ExpenseCategoryReadPort } from '../application/ports/expense-category-read.port';
import type { ExpenseCategory } from '../domain/expense-category.aggregate';
import type { ExpenseCategoryNameAlreadyExists } from '../domain/expense-category.error';
import { expenseCategoryNameAlreadyExists } from '../domain/expense-category.error';
import type { ExpenseCategoryRepository } from '../domain/expense-category.repository';
import type { Email } from '../domain/email.value-object';
import { expenseCategoryMapper } from './expense-category.mapper';
import { expenseCategories } from './expense-category.model';

export class DrizzleExpenseCategoryRepository implements ExpenseCategoryRepository, ExpenseCategoryReadPort {
  constructor(private readonly db: PostgresJsDatabase) {}

  async findOwned(id: string, ownerEmail: Email): Promise<ExpenseCategory | null> {
    const [row] = await this.db
      .select()
      .from(expenseCategories)
      .where(and(eq(expenseCategories.id, id), eq(expenseCategories.ownerEmail, ownerEmail.value)));
    return row ? expenseCategoryMapper.toDomain(row) : null;
  }

  /** One aggregate per transaction. A name the same owner already uses is refused by the unique index. */
  async save(category: ExpenseCategory): Promise<Result<void, ExpenseCategoryNameAlreadyExists>> {
    const row = expenseCategoryMapper.toRow(category);
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .insert(expenseCategories)
          .values(row)
          .onConflictDoUpdate({ target: expenseCategories.id, set: row });
      });
    } catch (error) {
      if (isUniqueViolation(error)) return err(expenseCategoryNameAlreadyExists(row.name));
      throw error;
    }
    return ok(undefined);
  }

  async deleteOwned(id: string, ownerEmail: Email): Promise<boolean> {
    const deleted = await this.db
      .delete(expenseCategories)
      .where(and(eq(expenseCategories.id, id), eq(expenseCategories.ownerEmail, ownerEmail.value)))
      .returning({ id: expenseCategories.id });
    return deleted.length > 0;
  }

  async listByOwner(ownerEmail: Email): Promise<ExpenseCategoryDto[]> {
    const rows = await this.db
      .select()
      .from(expenseCategories)
      .where(eq(expenseCategories.ownerEmail, ownerEmail.value))
      .orderBy(asc(expenseCategories.createdAt), asc(expenseCategories.id));
    return rows.map(expenseCategoryMapper.toDto);
  }
}

/** Postgres unique_violation: an expected business outcome, not an outage. Drizzle wraps the driver error, so unwrap it. */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ((error as { code?: unknown }).code === '23505') return true;
  return isUniqueViolation((error as { cause?: unknown }).cause);
}