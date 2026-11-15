import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../create-expense-category/create-expense-category.handler';
import { CreateExpenseSubcategoryHandler } from './create-expense-subcategory.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;

const ada = Email.reconstitute('ada@example.com');
const grace = Email.reconstitute('grace@example.com');

describe('CreateExpenseSubcategoryHandler', () => {
  it('adds a subcategory to a category the user owns and returns it', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    await new CreateExpenseCategoryHandler(categories, clock).execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Food',
    });
    const create = new CreateExpenseSubcategoryHandler(categories);

    const result = await create.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });

    expect(result.ok && result.value).toEqual({ id: 'subcategory-1', name: 'Groceries' });
    expect(await categories.listSubcategories('category-1', ada)).toEqual([
      { id: 'subcategory-1', name: 'Groceries' },
    ]);
  });

  it('refuses a category the user does not own', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    await new CreateExpenseCategoryHandler(categories, clock).execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Food',
    });
    const create = new CreateExpenseSubcategoryHandler(categories);

    const result = await create.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'grace@example.com',
      name: 'Groceries',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
    expect(await categories.listSubcategories('category-1', ada)).toEqual([]);
  });

  it('refuses a category that does not exist', async () => {
    const create = new CreateExpenseSubcategoryHandler(new InMemoryExpenseCategoryRepository());

    const result = await create.execute({
      categoryId: 'missing',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
  });

  it('refuses a name another subcategory of the same category already uses', async () => {
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

    const result = await create.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-2',
      userEmail: 'ada@example.com',
      name: ' Groceries ',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('SubcategoryNameAlreadyExists');
    expect(await categories.listSubcategories('category-1', ada)).toHaveLength(1);
  });

  it('refuses a subcategory without a usable name', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    await new CreateExpenseCategoryHandler(categories, clock).execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Food',
    });
    const create = new CreateExpenseSubcategoryHandler(categories);

    const result = await create.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: ' ',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidSubcategoryName');
    expect(await categories.listSubcategories('category-1', ada)).toEqual([]);
  });

  it('refuses an address that is not an email', async () => {
    const create = new CreateExpenseSubcategoryHandler(new InMemoryExpenseCategoryRepository());

    const result = await create.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada',
      name: 'Groceries',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
  });

  it('allows the same name under a different category', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const createCategory = new CreateExpenseCategoryHandler(categories, clock);
    await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    await createCategory.execute({ categoryId: 'category-2', userEmail: 'ada@example.com', name: 'Transport' });
    const create = new CreateExpenseSubcategoryHandler(categories);
    await create.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Monthly',
    });

    const result = await create.execute({
      categoryId: 'category-2',
      subcategoryId: 'subcategory-2',
      userEmail: 'ada@example.com',
      name: 'Monthly',
    });

    expect(result.ok).toBe(true);
    expect(await categories.listSubcategories('category-1', ada)).toHaveLength(1);
    expect(await categories.listSubcategories('category-2', ada)).toHaveLength(1);
    expect(await categories.listSubcategories('category-1', grace)).toBeNull();
  });
});