import { and, asc, eq, notInArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { err, ok, type Result } from '@/shared/result';
import type { ExpenseCategoryDto } from '../application/dto/expense-category.dto';
import type { ExpenseSubcategoryDto } from '../application/dto/expense-subcategory.dto';
import type { ExpenseCategoryReadPort } from '../application/ports/expense-category-read.port';
import type { ExpenseCategory } from '../domain/expense-category.aggregate';
import type { ExpenseCategoryNameAlreadyExists } from '../domain/expense-category.error';
import { expenseCategoryNameAlreadyExists } from '../domain/expense-category.error';
import type { ExpenseCategoryRepository } from '../domain/expense-category.repository';
import type { Email } from '../domain/email.value-object';
import { expenseCategoryMapper, expenseSubcategoryMapper } from './expense-category.mapper';
import {
  expenseCategories,
  expenseSubcategories,
  type ExpenseSubcategoryRow,
} from './expense-category.model';

export class DrizzleExpenseCategoryRepository implements ExpenseCategoryRepository, ExpenseCategoryReadPort {
  constructor(private readonly db: PostgresJsDatabase) {}

  async findOwned(id: string, ownerEmail: Email): Promise<ExpenseCategory | null> {
    const [row] = await this.db
      .select()
      .from(expenseCategories)
      .where(and(eq(expenseCategories.id, id), eq(expenseCategories.ownerEmail, ownerEmail.value)));
    if (!row) return null;
    return expenseCategoryMapper.toDomain(row, await this.findSubcategories(id));
  }

  /**
   * One aggregate per transaction: the category, its subcategories, and the removal of the
   * subcategories that are no longer part of it. A name the same owner already uses is refused by the unique index.
   */
  async save(category: ExpenseCategory): Promise<Result<void, ExpenseCategoryNameAlreadyExists>> {
    const row = expenseCategoryMapper.toRow(category);
    const subcategories = category.subcategories.map((subcategory) =>
      expenseSubcategoryMapper.toRow(subcategory, row.id),
    );
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .insert(expenseCategories)
          .values(row)
          .onConflictDoUpdate({ target: expenseCategories.id, set: row });

        for (const subcategory of subcategories) {
          await tx
            .insert(expenseSubcategories)
            .values(subcategory)
            .onConflictDoUpdate({ target: expenseSubcategories.id, set: subcategory });
        }

        const kept = subcategories.map((subcategory) => subcategory.id);
        await tx.delete(expenseSubcategories).where(
          kept.length === 0
            ? eq(expenseSubcategories.categoryId, row.id)
            : and(eq(expenseSubcategories.categoryId, row.id), notInArray(expenseSubcategories.id, kept)),
        );
      });
    } catch (error) {
      if (isUniqueViolation(error)) return err(expenseCategoryNameAlreadyExists(row.name));
      throw error;
    }
    return ok(undefined);
  }

  async deleteOwned(id: string, ownerEmail: Email): Promise<boolean> {
    // The database deletes the expense-subcategories of the category with it.
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

  async listSubcategories(categoryId: string, ownerEmail: Email): Promise<ExpenseSubcategoryDto[] | null> {
    const [category] = await this.db
      .select({ id: expenseCategories.id })
      .from(expenseCategories)
      .where(and(eq(expenseCategories.id, categoryId), eq(expenseCategories.ownerEmail, ownerEmail.value)));
    if (!category) return null;
    return (await this.findSubcategories(categoryId)).map(expenseSubcategoryMapper.toDto);
  }

  private async findSubcategories(categoryId: string): Promise<ExpenseSubcategoryRow[]> {
    return this.db
      .select()
      .from(expenseSubcategories)
      .where(eq(expenseSubcategories.categoryId, categoryId))
      .orderBy(asc(expenseSubcategories.name), asc(expenseSubcategories.id));
  }
}

/** Postgres unique_violation: an expected business outcome, not an outage. Drizzle wraps the driver error, so unwrap it. */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  if ((error as { code?: unknown }).code === '23505') return true;
  return isUniqueViolation((error as { cause?: unknown }).cause);
}