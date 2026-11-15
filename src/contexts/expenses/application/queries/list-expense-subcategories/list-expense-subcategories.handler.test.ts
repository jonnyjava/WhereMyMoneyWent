import { describe, expect, it } from 'vitest';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../../commands/create-expense-category/create-expense-category.handler';
import { CreateExpenseSubcategoryHandler } from '../../commands/create-expense-subcategory/create-expense-subcategory.handler';
import { ListExpenseSubcategoriesHandler } from './list-expense-subcategories.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;


describe('ListExpenseSubcategoriesHandler', () => {
  it('lists the expense-subcategories of a category the user owns', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    await new CreateExpenseCategoryHandler(categories, clock).execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Food',
    });
    const create = new CreateExpenseSubcategoryHandler(categories);
    await create.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });
    await create.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-2',
      userEmail: 'ada@example.com',
      name: 'Bakery',
    });
    const list = new ListExpenseSubcategoriesHandler(categories);

    const result = await list.execute({ categoryId: 'category-1', userEmail: 'ada@example.com' });

    expect(result.ok && result.value).toEqual([
      { id: 'subcategory-2', name: 'Bakery' },
      { id: 'subcategory-1', name: 'Groceries' },
    ]);
  });

  it('returns an empty list for an expense-category without expense-subcategories', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    await new CreateExpenseCategoryHandler(categories, clock).execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Food',
    });
    const list = new ListExpenseSubcategoriesHandler(categories);

    const result = await list.execute({ categoryId: 'category-1', userEmail: 'ada@example.com' });

    expect(result.ok && result.value).toEqual([]);
  });

  it('reports an expense-category that does not belong to the user as not found', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    await new CreateExpenseCategoryHandler(categories, clock).execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Food',
    });
    const list = new ListExpenseSubcategoriesHandler(categories);

    const result = await list.execute({ categoryId: 'category-1', userEmail: 'grace@example.com' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
  });

  it('reports an expense-category that does not exist as not found', async () => {
    const list = new ListExpenseSubcategoriesHandler(new InMemoryExpenseCategoryRepository());

    const result = await list.execute({ categoryId: 'missing', userEmail: 'ada@example.com' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
  });

  it('refuses a request without a usable user', async () => {
    const list = new ListExpenseSubcategoriesHandler(new InMemoryExpenseCategoryRepository());

    const result = await list.execute({ categoryId: 'category-1', userEmail: 'not-an-email' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
  });
});