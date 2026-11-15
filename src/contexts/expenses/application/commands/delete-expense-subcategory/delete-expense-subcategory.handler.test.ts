import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../create-expense-category/create-expense-category.handler';
import { CreateExpenseSubcategoryHandler } from '../create-expense-subcategory/create-expense-subcategory.handler';
import { DeleteExpenseSubcategoryHandler } from './delete-expense-subcategory.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;

const ada = Email.reconstitute('ada@example.com');

async function fixture(): Promise<{
  categories: InMemoryExpenseCategoryRepository;
  remove: DeleteExpenseSubcategoryHandler;
}> {
  const categories = new InMemoryExpenseCategoryRepository();
  await new CreateExpenseCategoryHandler(categories, clock).execute({
    categoryId: 'category-1',
    userEmail: 'ada@example.com',
    name: 'Food',
  });
  await new CreateExpenseSubcategoryHandler(categories).execute({
    categoryId: 'category-1',
    subcategoryId: 'subcategory-1',
    userEmail: 'ada@example.com',
    name: 'Groceries',
  });
  return { categories, remove: new DeleteExpenseSubcategoryHandler(categories) };
}

describe('DeleteExpenseSubcategoryHandler', () => {
  it('removes an expense-subcategory', async () => {
    const { categories, remove } = await fixture();

    const result = await remove.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
    });

    expect(result.ok).toBe(true);
    expect(await categories.listSubcategories('category-1', ada)).toEqual([]);
  });

  it('refuses an expense-subcategory that does not exist', async () => {
    const { remove } = await fixture();

    const result = await remove.execute({
      categoryId: 'category-1',
      subcategoryId: 'missing',
      userEmail: 'ada@example.com',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseSubcategoryNotFound');
  });

  it('refuses a category the user does not own', async () => {
    const { categories, remove } = await fixture();

    const result = await remove.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'grace@example.com',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
    expect(await categories.listSubcategories('category-1', ada)).toHaveLength(1);
  });

  it('refuses an address that is not an email', async () => {
    const { remove } = await fixture();

    const result = await remove.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
  });
});