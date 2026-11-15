import postgres from 'postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createContainer, type Container } from './create-container';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required for integration tests');
const admin = postgres(url, { max: 1, onnotice: () => {} });
let container: Container;

describe('composition root (both contexts, real Postgres, real event bus)', () => {
  beforeAll(async () => {
    await migrate(drizzle(admin), { migrationsFolder: 'drizzle' });
    container = createContainer({ databaseUrl: url });
  });
  beforeEach(async () => {
    await admin`TRUNCATE reference.loans, reference.return_counters`;
    await admin`TRUNCATE expenses.expense_subcategories, expenses.expense_categories`;
  });
  afterAll(async () => {
    await container.close();
    await admin.end();
  });

  it('returning a loan in one context updates the counter in the other', async () => {
    await container.openLoan.execute({
      loanId: 'loan-1',
      bookId: 'book-1',
      borrowerEmail: 'ada@example.com',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
    expect(await container.getReturnCount.execute({})).toBe(0);

    const returned = await container.returnLoan.execute({ loanId: 'loan-1' });

    expect(returned.ok).toBe(true);
    expect(await container.getReturnCount.execute({})).toBe(1);
    const loan = await container.getLoan.execute({ loanId: 'loan-1' });
    expect(loan.ok && loan.value.returned).toBe(true);
  });

  it('creates and lists expense-categories through the wiring', async () => {
    const created = await container.createExpenseCategory.execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Food',
    });
    expect(created.ok && created.value).toEqual({ id: 'category-1', name: 'Food' });

    const listed = await container.listExpenseCategories.execute({ userEmail: 'ada@example.com' });
    expect(listed.ok && listed.value).toEqual([{ id: 'category-1', name: 'Food' }]);
  });

  it('creates and lists expense-subcategories through the wiring', async () => {
    await container.createExpenseCategory.execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Food',
    });

    const created = await container.createExpenseSubcategory.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });
    expect(created.ok && created.value).toEqual({ id: 'subcategory-1', name: 'Groceries' });

    const listed = await container.listExpenseSubcategories.execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
    });
    expect(listed.ok && listed.value).toEqual([{ id: 'subcategory-1', name: 'Groceries' }]);
  });
});
