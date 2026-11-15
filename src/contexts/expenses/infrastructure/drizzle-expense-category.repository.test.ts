import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ExpenseCategory } from '../domain/expense-category.aggregate';
import { Email } from '../domain/email.value-object';
import { DrizzleExpenseCategoryRepository } from './drizzle-expense-category.repository';
import { expenseCategories, expenseSubcategories } from './expense-category.model';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required for integration tests');
const sql = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(sql);
const repository = new DrizzleExpenseCategoryRepository(db);
const now = new Date('2026-01-01T00:00:00Z');
const later = new Date('2026-01-02T00:00:00Z');
const ada = Email.reconstitute('ada@example.com');
const grace = Email.reconstitute('grace@example.com');

function category(id: string, name: string, ownerEmail = ada, createdAt = now): ExpenseCategory {
  const created = ExpenseCategory.create({ id, name, ownerEmail }, createdAt);
  if (!created.ok) throw new Error('fixture must be valid');
  return created.value;
}

describe('DrizzleExpenseCategoryRepository (real Postgres)', () => {
  beforeAll(async () => {
    await migrate(db, { migrationsFolder: 'drizzle' });
  });
  beforeEach(async () => {
    await db.delete(expenseSubcategories);
    await db.delete(expenseCategories);
  });
  afterAll(async () => {
    await sql.end();
  });

  it('saves and loads a category owned by its user', async () => {
    await repository.save(category('category-1', 'Food'));

    const loaded = await repository.findOwned('category-1', ada);

    expect(loaded?.toSnapshot()).toMatchObject({ id: 'category-1', createdAt: now });
    expect(loaded?.name.value).toBe('Food');
  });

  it('updates an existing category instead of inserting a duplicate', async () => {
    const found = category('category-1', 'Food');
    await repository.save(found);
    if (!found.rename('Groceries').ok) throw new Error('rename must succeed');

    await repository.save(found);

    const rows = await db.select().from(expenseCategories);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe('Groceries');
  });

  it('refuses a second category with the same name for the same owner', async () => {
    await repository.save(category('category-1', 'Food'));

    const saved = await repository.save(category('category-2', ' Food '));

    expect(saved.ok).toBe(false);
    expect(!saved.ok && saved.error.kind).toBe('ExpenseCategoryNameAlreadyExists');
    expect(await db.select().from(expenseCategories)).toHaveLength(1);
  });

  it('allows the same name under another owner', async () => {
    await repository.save(category('category-1', 'Food'));

    const saved = await repository.save(category('category-2', 'Food', grace));

    expect(saved.ok).toBe(true);
    expect(await db.select().from(expenseCategories)).toHaveLength(2);
  });

  it('returns null for a category that belongs to another user', async () => {
    await repository.save(category('category-1', 'Food'));

    expect(await repository.findOwned('category-1', grace)).toBeNull();
  });

  it('deletes only the category of the requesting user', async () => {
    await repository.save(category('category-1', 'Food'));
    await repository.save(category('category-2', 'Books', grace));

    expect(await repository.deleteOwned('category-1', grace)).toBe(false);
    expect(await repository.deleteOwned('category-1', ada)).toBe(true);
    expect(await repository.findOwned('category-1', ada)).toBeNull();
    expect(await repository.findOwned('category-2', grace)).not.toBeNull();
  });

  it('lists the categories of one owner, oldest first', async () => {
    await repository.save(category('category-1', 'Food', ada, now));
    await repository.save(category('category-2', 'Rent', ada, later));
    await repository.save(category('category-3', 'Books', grace, now));

    expect(await repository.listByOwner(ada)).toEqual([
      { id: 'category-1', name: 'Food' },
      { id: 'category-2', name: 'Rent' },
    ]);
  });

  it('saves and loads the expense-subcategories of a category', async () => {
    const found = category('category-1', 'Food');
    if (!found.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');
    if (!found.addSubcategory({ id: 'subcategory-2', name: 'Bakery' }).ok) throw new Error('fixture');
    await repository.save(found);

    const loaded = await repository.findOwned('category-1', ada);

    expect(loaded?.subcategories.map((subcategory) => subcategory.name.value)).toEqual(['Bakery', 'Groceries']);
  });

  it('updates a renamed expense-subcategory instead of duplicating it', async () => {
    const found = category('category-1', 'Food');
    if (!found.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');
    await repository.save(found);
    if (!found.renameSubcategory('subcategory-1', 'Fresh food').ok) throw new Error('rename must succeed');

    await repository.save(found);

    expect(await db.select().from(expenseSubcategories)).toHaveLength(1);
    expect(await repository.listSubcategories('category-1', ada)).toEqual([
      { id: 'subcategory-1', name: 'Fresh food' },
    ]);
  });

  it('removes an expense-subcategory that is no longer part of the category', async () => {
    const found = category('category-1', 'Food');
    if (!found.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');
    if (!found.addSubcategory({ id: 'subcategory-2', name: 'Bakery' }).ok) throw new Error('fixture');
    await repository.save(found);
    if (!found.removeSubcategory('subcategory-2').ok) throw new Error('remove must succeed');

    await repository.save(found);

    expect(await repository.listSubcategories('category-1', ada)).toEqual([
      { id: 'subcategory-1', name: 'Groceries' },
    ]);
  });

  it('allows the same expense-subcategory name under two categories', async () => {
    const food = category('category-1', 'Food');
    const transport = category('category-2', 'Transport');
    if (!food.addSubcategory({ id: 'subcategory-1', name: 'Monthly' }).ok) throw new Error('fixture');
    if (!transport.addSubcategory({ id: 'subcategory-2', name: 'Monthly' }).ok) throw new Error('fixture');

    await repository.save(food);
    await repository.save(transport);

    expect(await repository.listSubcategories('category-1', ada)).toEqual([
      { id: 'subcategory-1', name: 'Monthly' },
    ]);
    expect(await repository.listSubcategories('category-2', ada)).toEqual([
      { id: 'subcategory-2', name: 'Monthly' },
    ]);
  });

  it('deletes the expense-subcategories of a category with the category', async () => {
    const found = category('category-1', 'Food');
    if (!found.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');
    await repository.save(found);

    await repository.deleteOwned('category-1', ada);

    expect(await db.select().from(expenseSubcategories)).toHaveLength(0);
    expect(await repository.listSubcategories('category-1', ada)).toBeNull();
  });

  it('refuses to list the expense-subcategories of a category owned by another user', async () => {
    await repository.save(category('category-1', 'Food'));

    expect(await repository.listSubcategories('category-1', grace)).toBeNull();
    expect(await repository.listSubcategories('missing', ada)).toBeNull();
  });
});