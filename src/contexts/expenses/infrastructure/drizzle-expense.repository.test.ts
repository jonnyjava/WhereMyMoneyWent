import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ExpenseCategory } from '../domain/expense-category.aggregate';
import { Expense } from '../domain/expense.aggregate';
import { Email } from '../domain/email.value-object';
import { categoryTarget, subcategoryTarget } from '../domain/expense-target.value-object';
import { DrizzleExpenseCategoryRepository } from './drizzle-expense-category.repository';
import { expenseCategories, expenseSubcategories } from './expense-category.model';
import { DrizzleExpenseRepository } from './drizzle-expense.repository';
import { expenses } from './expense.model';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required for integration tests');
const sql = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(sql);
const repository = new DrizzleExpenseRepository(db);
const categories = new DrizzleExpenseCategoryRepository(db);
const ada = Email.reconstitute('ada@example.com');
const grace = Email.reconstitute('grace@example.com');
const createdAt = new Date('2026-01-01T00:00:00Z');

function category(id: string, name: string, ownerEmail = ada): ExpenseCategory {
  const created = ExpenseCategory.create({ id, name, ownerEmail }, createdAt);
  if (!created.ok) throw new Error('fixture must be valid');
  return created.value;
}

function expense(
  id: string,
  amountCents: number,
  spentOn: string,
  target: ReturnType<typeof categoryTarget>,
  created_at: Date,
  ownerEmail = ada,
): Expense {
  const created = Expense.create({ id, amountCents, spentOn, target, ownerEmail }, created_at);
  if (!created.ok) throw new Error('fixture must be valid');
  return created.value;
}

describe('DrizzleExpenseRepository (real Postgres)', () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  beforeEach(async () => {
    await db.delete(expenses);
    await db.delete(expenseSubcategories);
    await db.delete(expenseCategories);
  });
  afterAll(async () => {
    await sql.end();
  });

  it('saves and loads an expense with a category target', async () => {
    await categories.save(category('category-1', 'Food'));

    await repository.save(
      expense('expense-1', 1250, '2026-01-10', categoryTarget('category-1'), new Date('2026-01-15T10:00:00Z')),
    );

    const loaded = await repository.findOwned('expense-1', ada);

    expect(loaded?.toSnapshot()).toMatchObject({
      id: 'expense-1',
      createdAt: new Date('2026-01-15T10:00:00Z'),
    });
    expect(loaded?.amount.cents).toBe(1250);
    expect(loaded?.spentOn.value).toBe('2026-01-10');
    expect(loaded?.target).toEqual(categoryTarget('category-1'));
  });

  it('saves and loads an expense with a subcategory target', async () => {
    const found = category('category-1', 'Food');
    if (!found.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');
    await categories.save(found);

    await repository.save(
      expense(
        'expense-1',
        1250,
        '2026-01-10',
        subcategoryTarget('category-1', 'subcategory-1'),
        new Date('2026-01-15T10:00:00Z'),
      ),
    );

    const loaded = await repository.findOwned('expense-1', ada);

    expect(loaded?.target).toEqual(subcategoryTarget('category-1', 'subcategory-1'));
  });

  it('updates an expense instead of inserting a duplicate', async () => {
    await categories.save(category('category-1', 'Food'));
    const found = expense(
      'expense-1',
      1250,
      '2026-01-10',
      categoryTarget('category-1'),
      new Date('2026-01-15T10:00:00Z'),
    );
    await repository.save(found);
    if (
      !found
        .edit(
          { amountCents: 2000, spentOn: '2026-01-12', target: categoryTarget('category-1') },
          new Date('2026-01-15T11:00:00Z'),
        )
        .ok
    ) {
      throw new Error('edit must succeed');
    }

    await repository.save(found);

    const rows = await db.select().from(expenses);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.amountCents).toBe(2000);
    expect(rows[0]?.spentOn).toBe('2026-01-12');
  });

  it('returns nothing for an expense that belongs to another user', async () => {
    await categories.save(category('category-1', 'Food'));
    await repository.save(
      expense('expense-1', 1250, '2026-01-10', categoryTarget('category-1'), new Date('2026-01-15T10:00:00Z')),
    );

    expect(await repository.findOwned('expense-1', grace)).toBeNull();
    expect(await repository.deleteOwned('expense-1', grace)).toBe(false);
    expect(await repository.findOwned('expense-1', ada)).not.toBeNull();
  });

  it('lists the expenses of one owner by date, then by time of creation', async () => {
    await categories.save(category('category-1', 'Food'));
    await repository.save(
      expense('expense-1', 1250, '2026-01-10', categoryTarget('category-1'), new Date('2026-01-15T10:00:00Z')),
    );
    await repository.save(
      expense('expense-2', 900, '2026-01-10', categoryTarget('category-1'), new Date('2026-01-15T11:00:00Z')),
    );
    await repository.save(
      expense('expense-3', 500, '2026-01-05', categoryTarget('category-1'), new Date('2026-01-15T09:00:00Z')),
    );
    await repository.save(
      expense(
        'expense-4',
        700,
        '2026-01-01',
        categoryTarget('category-1'),
        new Date('2026-01-15T12:00:00Z'),
        grace,
      ),
    );

    expect(await repository.listByOwner(ada)).toMatchObject([
      { id: 'expense-3', amountCents: 500, spentOn: '2026-01-05' },
      { id: 'expense-1', amountCents: 1250, spentOn: '2026-01-10' },
      { id: 'expense-2', amountCents: 900, spentOn: '2026-01-10' },
    ]);
  });

  it('deletes an expense of its owner', async () => {
    await categories.save(category('category-1', 'Food'));
    await repository.save(
      expense('expense-1', 1250, '2026-01-10', categoryTarget('category-1'), new Date('2026-01-15T10:00:00Z')),
    );

    expect(await repository.deleteOwned('expense-1', ada)).toBe(true);
    expect(await repository.findOwned('expense-1', ada)).toBeNull();
  });

  it('deletes the expenses of a category with the category', async () => {
    await categories.save(category('category-1', 'Food'));
    await repository.save(
      expense('expense-1', 1250, '2026-01-10', categoryTarget('category-1'), new Date('2026-01-15T10:00:00Z')),
    );

    await categories.deleteOwned('category-1', ada);

    expect(await db.select().from(expenses)).toHaveLength(0);
  });

  it('deletes the expenses of an expense-subcategory with the expense-subcategory', async () => {
    const found = category('category-1', 'Food');
    if (!found.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');
    await categories.save(found);
    await repository.save(
      expense(
        'expense-1',
        1250,
        '2026-01-10',
        subcategoryTarget('category-1', 'subcategory-1'),
        new Date('2026-01-15T10:00:00Z'),
      ),
    );
    if (!found.removeSubcategory('subcategory-1').ok) throw new Error('remove must succeed');

    await categories.save(found);

    expect(await db.select().from(expenses)).toHaveLength(0);
  });
});