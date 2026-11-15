import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseRepository } from '../../../testing/in-memory-expense.repository';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../create-expense-category/create-expense-category.handler';
import { CreateExpenseSubcategoryHandler } from '../create-expense-subcategory/create-expense-subcategory.handler';
import { RegisterExpenseHandler } from '../register-expense/register-expense.handler';
import { EditExpenseHandler } from './edit-expense.handler';

const ada = Email.reconstitute('ada@example.com');
const grace = Email.reconstitute('grace@example.com');

const now = new Date('2026-01-15T10:00:00Z');
const clock = () => now;

function fixture(): {
  expenses: InMemoryExpenseRepository;
  edit: EditExpenseHandler;
  register: RegisterExpenseHandler;
  createCategory: CreateExpenseCategoryHandler;
  createSubcategory: CreateExpenseSubcategoryHandler;
} {
  const categories = new InMemoryExpenseCategoryRepository();
  const expenses = new InMemoryExpenseRepository();
  return {
    expenses,
    edit: new EditExpenseHandler(expenses, categories, clock),
    register: new RegisterExpenseHandler(expenses, categories, clock),
    createCategory: new CreateExpenseCategoryHandler(categories, clock),
    createSubcategory: new CreateExpenseSubcategoryHandler(categories),
  };
}

async function seeded(): Promise<Awaited<ReturnType<typeof fixture>>> {
  const context = fixture();
  await context.createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
  await context.createCategory.execute({ categoryId: 'category-2', userEmail: 'ada@example.com', name: 'Transport' });
  await context.register.execute({
    expenseId: 'expense-1',
    userEmail: 'ada@example.com',
    amountCents: 1250,
    spentOn: '2026-01-10',
    categoryId: 'category-1',
  });
  return context;
}

describe('EditExpenseHandler', () => {
  it('edits the amount, the date and the target of an expense the user owns', async () => {
    const { expenses, edit } = await seeded();

    const result = await edit.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 2000,
      spentOn: '2026-01-12',
      categoryId: 'category-2',
    });

    expect(result.ok).toBe(true);
    expect(await expenses.listByOwner(ada)).toMatchObject([
      { id: 'expense-1', amountCents: 2000, spentOn: '2026-01-12', categoryId: 'category-2', subcategoryId: null },
    ]);
  });

  it('refuses an expense the user does not own', async () => {
    const { expenses, edit } = await seeded();

    const result = await edit.execute({
      expenseId: 'expense-1',
      userEmail: 'grace@example.com',
      amountCents: 2000,
      spentOn: '2026-01-12',
      categoryId: 'category-2',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseNotFound');
    expect(await expenses.listByOwner(grace)).toEqual([]);
  });

  it('refuses an amount of 0 or less and keeps the old amount', async () => {
    const { expenses, edit } = await seeded();

    const result = await edit.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: -1,
      spentOn: '2026-01-12',
      categoryId: 'category-2',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidAmount');
    expect(await expenses.listByOwner(ada)).toMatchObject([{ id: 'expense-1', amountCents: 1250 }]);
  });

  it('refuses a target the user does not own', async () => {
    const { createCategory, edit } = await seeded();
    await createCategory.execute({ categoryId: 'category-3', userEmail: 'grace@example.com', name: 'Books' });

    const result = await edit.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 2000,
      spentOn: '2026-01-12',
      categoryId: 'category-3',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryNotFound');
  });

  it('refuses an expense-category that still has expense-subcategories', async () => {
    const { createSubcategory, edit } = await seeded();
    await createSubcategory.execute({
      categoryId: 'category-2',
      subcategoryId: 'subcategory-1',
      userEmail: 'ada@example.com',
      name: 'Monthly',
    });

    const result = await edit.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 2000,
      spentOn: '2026-01-12',
      categoryId: 'category-2',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseCategoryHasSubcategories');
  });

  it('refuses a target that does not exist', async () => {
    const { edit } = await seeded();

    const result = await edit.execute({
      expenseId: 'expense-1',
      userEmail: 'ada@example.com',
      amountCents: 2000,
      spentOn: '2026-01-12',
      categoryId: 'category-2',
      subcategoryId: 'missing',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseSubcategoryNotFound');
  });

  it('refuses an expense that does not exist', async () => {
    const { edit } = await seeded();

    const result = await edit.execute({
      expenseId: 'missing',
      userEmail: 'ada@example.com',
      amountCents: 2000,
      spentOn: '2026-01-12',
      categoryId: 'category-2',
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseNotFound');
  });
});