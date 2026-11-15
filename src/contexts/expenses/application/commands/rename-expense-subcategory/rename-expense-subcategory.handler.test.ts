import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../create-expense-category/create-expense-category.handler';
import { CreateExpenseSubcategoryHandler } from '../create-expense-subcategory/create-expense-subcategory.handler';
import { RenameExpenseSubcategoryHandler } from './rename-expense-subcategory.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;

const ada = Email.reconstitute('ada@example.com');
const grace = Email.reconstitute('grace@example.com');

async function fixture(): Promise<{
  categories: InMemoryExpenseCategoryRepository;
  rename: RenameExpenseSubcategoryHandler;
}> {
  const categories = new InMemoryExpenseCategoryRepository();
  const createCategory = new CreateExpenseCategoryHandler(categories, clock);
  const createSubcategory = new CreateExpenseSubcategoryHandler(categories);
  await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
  await createSubcategory.execute({
    categoryId: 'category-1',
    subcategoryId: 'subcategory-1',
    userEmail: 'ada@example.com',
    name: 'Groceries',
  });
  await createSubcategory.execute({
    categoryId: 'category-1',
    subcategoryId: 'subcategory-2',
    userEmail: 'ada@example.com',
    name: 'Bakery',
  });
  return { categories, rename: new RenameExpenseSubcategoryHandler(categories) };
}

describe('RenameExpenseSubcategoryHandler', () => {
  it('renames an expense-subcategory', async () => {
    const { categories, rename } = await fixture();

    const result = await rename.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Fresh food',
    });

    expect(result.ok).toBe(true);
    expect(await categories.listSubcategories('category-1', ada)).toEqual([
      { id: 'subcategory-2', name: 'Bakery' },
      { id: 'subcategory-1', name: 'Fresh food' },
    ]);
  });

  it('refuses a name another subcategory of the same category already uses', async () => {
    const { categories, rename } = await fixture();

    const result = await rename.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-2',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('SubcategoryNameAlreadyExists');
    expect(await categories.listSubcategories('category-1', ada)).toHaveLength(2);
  });

  it('refuses to rename an expense-subcategory that does not exist', async () => {
    const { rename } = await fixture();

    const result = await rename.execute({
      categoryId: 'category-1',
      subcategoryId: 'missing',
      userEmail: 'ada@example.com',
      name: 'Fresh food',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseSubcategoryNotFound');
  });

  it('refuses a category the user does not own', async () => {
    const { categories, rename } = await fixture();

    const result = await rename.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'grace@example.com',
      name: 'Fresh food',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
    expect(await categories.listSubcategories('category-1', grace)).toBeNull();
  });

  it('refuses a name that is not usable', async () => {
    const { categories, rename } = await fixture();

    const result = await rename.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: ' ',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidSubcategoryName');
    expect(await categories.listSubcategories('category-1', ada)).toHaveLength(2);
  });
});