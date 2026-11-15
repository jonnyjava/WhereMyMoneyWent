import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from './create-expense-category.handler';

const now = new Date('2026-01-01T00:00:00Z');
const clock = () => now;

const ada = Email.reconstitute('ada@example.com');
const grace = Email.reconstitute('grace@example.com');

function fixture(): { categories: InMemoryExpenseCategoryRepository; create: CreateExpenseCategoryHandler } {
  const categories = new InMemoryExpenseCategoryRepository();
  return { categories, create: new CreateExpenseCategoryHandler(categories, clock) };
}

describe('CreateExpenseCategoryHandler', () => {
  it('creates a category owned by the requesting user and returns it', async () => {
    const { categories, create } = fixture();

    const result = await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });

    expect(result.ok && result.value).toEqual({ id: 'category-1', name: 'Food' });
    expect(await categories.listByOwner(ada)).toEqual([{ id: 'category-1', name: 'Food' }]);
  });

  it('refuses an address that is not an email and stores nothing', async () => {
    const { categories, create } = fixture();

    const result = await create.execute({ categoryId: 'category-1', userEmail: 'ada', name: 'Food' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
    expect(await categories.listByOwner(ada)).toEqual([]);
  });

  it('refuses a category without a usable name and stores nothing', async () => {
    const { categories, create } = fixture();

    const result = await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: '  ' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidCategoryName');
    expect(await categories.listByOwner(ada)).toEqual([]);
  });

  it('refuses a name the same user already uses for another category', async () => {
    const { categories, create } = fixture();
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });

    const result = await create.execute({ categoryId: 'category-2', userEmail: 'ada@example.com', name: ' Food ' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNameAlreadyExists');
    expect(await categories.listByOwner(ada)).toHaveLength(1);
  });

  it('allows the same name under a different user', async () => {
    const { categories, create } = fixture();
    await create.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });

    const result = await create.execute({ categoryId: 'category-2', userEmail: 'grace@example.com', name: 'Food' });

    expect(result.ok).toBe(true);
    expect(await categories.listByOwner(ada)).toHaveLength(1);
    expect(await categories.listByOwner(grace)).toHaveLength(1);
  });
});