import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseRepository } from '../../../testing/in-memory-expense.repository';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../../commands/create-expense-category/create-expense-category.handler';
import { RegisterExpenseHandler } from '../../commands/register-expense/register-expense.handler';
import { ListExpensesHandler } from './list-expenses.handler';

const grace = Email.reconstitute('grace@example.com');

let now = new Date('2026-01-15T10:00:00Z');
const clock = () => now;

async function seeded(): Promise<{
  expenses: InMemoryExpenseRepository;
  list: ListExpensesHandler;
}> {
  const categories = new InMemoryExpenseCategoryRepository();
  const expenses = new InMemoryExpenseRepository();
  const createCategory = new CreateExpenseCategoryHandler(categories, clock);
  await createCategory.execute({
    categoryId: 'category-1',
    userEmail: 'ada@example.com',
    name: 'Food',
  });
  await createCategory.execute({
    categoryId: 'category-2',
    userEmail: 'grace@example.com',
    name: 'Books',
  });
  const register = new RegisterExpenseHandler(expenses, categories, clock);

  now = new Date('2026-01-15T10:00:00Z');
  await register.execute({
    expenseId: 'expense-1',
    userEmail: 'ada@example.com',
    amountCents: 1250,
    spentOn: '2026-01-10',
    categoryId: 'category-1',
  });
  now = new Date('2026-01-15T11:00:00Z');
  await register.execute({
    expenseId: 'expense-2',
    userEmail: 'ada@example.com',
    amountCents: 900,
    spentOn: '2026-01-10',
    categoryId: 'category-1',
  });
  now = new Date('2026-01-15T09:00:00Z');
  await register.execute({
    expenseId: 'expense-3',
    userEmail: 'ada@example.com',
    amountCents: 500,
    spentOn: '2026-01-05',
    categoryId: 'category-1',
  });
  now = new Date('2026-01-15T12:00:00Z');
  await register.execute({
    expenseId: 'expense-4',
    userEmail: 'grace@example.com',
    amountCents: 700,
    spentOn: '2026-01-01',
    categoryId: 'category-2',
  });

  return { expenses, list: new ListExpensesHandler(expenses) };
}

describe('ListExpensesHandler', () => {
  it('lists the user expenses by date, then by time of creation', async () => {
    const { list } = await seeded();

    const result = await list.execute({ userEmail: 'ada@example.com' });

    expect(result.ok && result.value.map((expense) => expense.id)).toEqual([
      'expense-3',
      'expense-1',
      'expense-2',
    ]);
    expect(result.ok && result.value[0]).toMatchObject({ amountCents: 500, spentOn: '2026-01-05' });
  });

  it('never returns the expenses of another user', async () => {
    const { expenses, list } = await seeded();

    const result = await list.execute({ userEmail: 'ada@example.com' });

    expect(result.ok && result.value.map((expense) => expense.ownerEmail)).toEqual([
      'ada@example.com',
      'ada@example.com',
      'ada@example.com',
    ]);
    expect(await expenses.listByOwner(grace)).toMatchObject([
      { id: 'expense-4', categoryId: 'category-2', ownerEmail: 'grace@example.com' },
    ]);
  });

  it('returns an empty list for a user without expenses', async () => {
    const list = new ListExpensesHandler(new InMemoryExpenseRepository());

    const result = await list.execute({ userEmail: 'ada@example.com' });

    expect(result.ok && result.value).toEqual([]);
  });

  it('refuses a request without a usable user', async () => {
    const list = new ListExpensesHandler(new InMemoryExpenseRepository());

    const result = await list.execute({ userEmail: 'not-an-email' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
  });
});