import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../create-expense-category/create-expense-category.handler';
import { RenameExpenseCategoryHandler } from './rename-expense-category.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;

const ada = Email.reconstitute('ada@example.com');
const grace = Email.reconstitute('grace@example.com');

describe('RenameExpenseCategoryHandler', () => {
  it('renames an expense-category the user owns', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const create = new CreateExpenseCategoryHandler(categories, clock);
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    const rename = new RenameExpenseCategoryHandler(categories);

    const result = await rename.execute({
      categoryId: 'category-1',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });

    expect(result.ok).toBe(true);
    expect(await categories.listByOwner(ada)).toEqual([{ id: 'category-1', name: 'Groceries' }]);
  });

  it('refuses a name the same user already uses for another category', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const create = new CreateExpenseCategoryHandler(categories, clock);
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    await create.execute({ categoryId: 'category-2', userEmail: 'ada@example.com', name: 'Rent' });
    const rename = new RenameExpenseCategoryHandler(categories);

    const result = await rename.execute({
      categoryId: 'category-2',
      userEmail: 'ada@example.com',
      name: 'Food',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNameAlreadyExists');
    expect(await categories.listByOwner(ada)).toEqual([
      { id: 'category-1', name: 'Food' },
      { id: 'category-2', name: 'Rent' },
    ]);
  });

  it('refuses to rename an expense-category the user does not own', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const create = new CreateExpenseCategoryHandler(categories, clock);
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    const rename = new RenameExpenseCategoryHandler(categories);

    const result = await rename.execute({
      categoryId: 'category-1',
      userEmail: 'grace@example.com',
      name: 'Groceries',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
    expect(await categories.listByOwner(ada)).toEqual([{ id: 'category-1', name: 'Food' }]);
    expect(await categories.listByOwner(grace)).toEqual([]);
  });

  it('refuses to rename an expense-category that does not exist', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const rename = new RenameExpenseCategoryHandler(categories);

    const result = await rename.execute({ categoryId: 'missing', userEmail: 'ada@example.com', name: 'Food' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
  });

  it('refuses an expense-category name that is not usable', async () => {
    const categories = new InMemoryExpenseCategoryRepository();
    const create = new CreateExpenseCategoryHandler(categories, clock);
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    const rename = new RenameExpenseCategoryHandler(categories);

    const result = await rename.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: ' ' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidCategoryName');
    expect(await categories.listByOwner(ada)).toEqual([{ id: 'category-1', name: 'Food' }]);
  });
});