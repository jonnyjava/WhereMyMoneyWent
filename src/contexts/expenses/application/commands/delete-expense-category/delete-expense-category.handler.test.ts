import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../create-expense-category/create-expense-category.handler';
import { DeleteExpenseCategoryHandler } from './delete-expense-category.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;

const ada = Email.reconstitute('ada@example.com');

describe('DeleteExpenseCategoryHandler', () => {
  it('deletes an expense-category the user owns', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const create = new CreateExpenseCategoryHandler(categories, clock);
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    const remove = new DeleteExpenseCategoryHandler(categories);

    const result = await remove.execute({ categoryId: 'category-1', userEmail: 'ada@example.com' });

    expect(result.ok).toBe(true);
    expect(await categories.listByOwner(ada)).toEqual([]);
  });

  it('refuses to delete an expense-category the user does not own', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const create = new CreateExpenseCategoryHandler(categories, clock);
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    const remove = new DeleteExpenseCategoryHandler(categories);

    const result = await remove.execute({ categoryId: 'category-1', userEmail: 'grace@example.com' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
    expect(await categories.listByOwner(ada)).toHaveLength(1);
  });

  it('refuses to delete an expense-category that does not exist', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const remove = new DeleteExpenseCategoryHandler(categories);

    const result = await remove.execute({ categoryId: 'missing', userEmail: 'ada@example.com' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
  });

  it('refuses an address that is not an email', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const remove = new DeleteExpenseCategoryHandler(categories);

    const result = await remove.execute({ categoryId: 'category-1', userEmail: 'ada' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
  });
});