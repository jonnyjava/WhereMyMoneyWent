import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../../commands/create-expense-category/create-expense-category.handler';
import { ListExpenseCategoriesHandler } from './list-expense-categories.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;

const grace = Email.reconstitute('grace@example.com');

describe('ListExpenseCategoriesHandler', () => {
  it('lists the expense-categories of the requesting user, oldest first', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const create = new CreateExpenseCategoryHandler(categories, clock);
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    await create.execute({ categoryId: 'category-2', userEmail: 'ada@example.com', name: 'Rent' });
    const list = new ListExpenseCategoriesHandler(categories);

    const result = await list.execute({ userEmail: 'ada@example.com' });

    expect(result.ok && result.value).toEqual([
      { id: 'category-1', name: 'Food' },
      { id: 'category-2', name: 'Rent' },
    ]);
  });

  it('never returns the expense-categories of another user', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const create = new CreateExpenseCategoryHandler(categories, clock);
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    await create.execute({ categoryId: 'category-2', userEmail: 'grace@example.com', name: 'Books' });
    const list = new ListExpenseCategoriesHandler(categories);

    const result = await list.execute({ userEmail: 'ada@example.com' });

    expect(result.ok && result.value).toEqual([{ id: 'category-1', name: 'Food' }]);
    expect(await categories.listByOwner(grace)).toEqual([{ id: 'category-2', name: 'Books' }]);
  });

  it('returns an empty list for a user with no expense-categories', async () => {
    const list = new ListExpenseCategoriesHandler(new InMemoryExpenseCategoryRepository());

    const result = await list.execute({ userEmail: 'ada@example.com' });

    expect(result.ok && result.value).toEqual([]);
  });

  it('refuses a request without a usable user', async () => {
    const list = new ListExpenseCategoriesHandler(new InMemoryExpenseCategoryRepository());

    const result = await list.execute({ userEmail: 'not-an-email' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
  });
});