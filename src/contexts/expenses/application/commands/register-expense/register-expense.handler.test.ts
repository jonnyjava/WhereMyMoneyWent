import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseRepository } from '../../../testing/in-memory-expense.repository';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../create-expense-category/create-expense-category.handler';
import { CreateExpenseSubcategoryHandler } from '../create-expense-subcategory/create-expense-subcategory.handler';
import { RegisterExpenseHandler } from './register-expense.handler';

const ada = Email.reconstitute('ada@example.com');
const grace = Email.reconstitute('grace@example.com');

const now = new Date('2026-01-15T10:00:00Z');
const clock = () => now;

function fixture(): {
  expenses: InMemoryExpenseRepository;
  categories: InMemoryExpenseCategoryRepository;
  register: RegisterExpenseHandler;
  createCategory: CreateExpenseCategoryHandler;
  createSubcategory: CreateExpenseSubcategoryHandler;
} {
  const categories = new InMemoryExpenseCategoryRepository();
  const expenses = new InMemoryExpenseRepository();
  return {
    expenses,
    categories,
    register: new RegisterExpenseHandler(expenses, categories, clock),
    createCategory: new CreateExpenseCategoryHandler(categories, clock),
    createSubcategory: new CreateExpenseSubcategoryHandler(categories),
  };
}

describe('RegisterExpenseHandler', () => {
  it('registers an expense under an owned expense-category and returns its id', async () => {
    const { expenses, createCategory, register } = fixture();
    await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 1250,
      spentOn: '2026-01-10',
      categoryId: 'category-1',
    });

    expect(result.ok && result.value).toBe('expense-1');
    expect(await expenses.listByOwner(ada)).toEqual([
      {
        id: 'expense-1',
        amountCents: 1250,
        spentOn: '2026-01-10',
        categoryId: 'category-1',
        subcategoryId: null,
        ownerEmail: 'ada@example.com',
      },
    ]);
  });

  it('defaults the date to today when none is given', async () => {
    const { expenses, createCategory, register } = fixture();
    await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 1250,
      categoryId: 'category-1',
    });

    expect(result.ok).toBe(true);
    expect(await expenses.listByOwner(ada)).toMatchObject([{ id: 'expense-1', spentOn: '2026-01-15' }]);
  });

  it('registers an expense under an owned expense-subcategory', async () => {
    const { expenses, createCategory, createSubcategory, register } = fixture();
    await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    await createSubcategory.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 1250,
      spentOn: '2026-01-10',
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
    });

    expect(result.ok).toBe(true);
    expect(await expenses.listByOwner(ada)).toMatchObject([
      { id: 'expense-1', categoryId: 'category-1', subcategoryId: 'subcategory-1' },
    ]);
  });

  it('refuses an amount of 0 or less', async () => {
    const { createCategory, register } = fixture();
    await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 0,
      spentOn: '2026-01-10',
      categoryId: 'category-1',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidAmount');
  });

  it('refuses a category the user does not own', async () => {
    const { expenses, createCategory, register } = fixture();
    await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'grace@example.com',
      amountCents: 1250,
      spentOn: '2026-01-10',
      categoryId: 'category-1',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
    expect(await expenses.listByOwner(grace)).toEqual([]);
  });

  it('refuses a category that does not exist', async () => {
    const { register } = fixture();

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 1250,
      spentOn: '2026-01-10',
      categoryId: 'missing',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
  });

  it('refuses an expense-category that still has expense-subcategories', async () => {
    const { createCategory, createSubcategory, register } = fixture();
    await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    await createSubcategory.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 1250,
      spentOn: '2026-01-10',
      categoryId: 'category-1',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryHasSubcategories');
  });

  it('refuses an expense-subcategory that the category does not have', async () => {
    const { createCategory, createSubcategory, register } = fixture();
    await createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
    await createSubcategory.execute({
      categoryId: 'category-1',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Groceries',
    });

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 1250,
      spentOn: '2026-01-10',
      categoryId: 'category-1',
      subcategoryId: 'missing',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseSubcategoryNotFound');
  });

  it('refuses an address that is not an email', async () => {
    const { register } = fixture();

    const result = await register.execute({
      expenseId: 'expense-1',
      userEmail: 'ada',
      amountCents: 1250,
      spentOn: '2026-01-10',
      categoryId: 'category-1',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
  });
});