import { describe, expect, it } from 'vitest';
import { Email } from '../../../domain/email.value-object';
import { InMemoryExpenseRepository } from '../../../testing/in-memory-expense.repository';
import { InMemoryExpenseCategoryRepository } from '../../../testing/in-memory-expense-category.repository';
import { CreateExpenseCategoryHandler } from '../create-expense-category/create-expense-category.handler';
import { RegisterExpenseHandler } from '../register-expense/register-expense.handler';
import { DeleteExpenseHandler } from './delete-expense.handler';

const ada = Email.reconstitute('ada@example.com');

const now = new Date('2026-01-15T10:00:00Z');
const clock = () => now;

function fixture(): {
  expenses: InMemoryExpenseRepository;
  remove: DeleteExpenseHandler;
  register: RegisterExpenseHandler;
  createCategory: CreateExpenseCategoryHandler;
} {
  const categories = new InMemoryExpenseCategoryRepository();
  const expenses = new InMemoryExpenseRepository();
  return {
    expenses,
    remove: new DeleteExpenseHandler(expenses),
    register: new RegisterExpenseHandler(expenses, categories, clock),
    createCategory: new CreateExpenseCategoryHandler(categories, clock),
  };
}

async function seeded(): Promise<Awaited<ReturnType<typeof fixture>>> {
  const context = fixture();
  await context.createCategory.execute({ categoryId: 'category-1', userEmail: 'ada@example.com', name: 'Food' });
  await context.register.execute({
    expenseId: 'expense-1',
    userEmail: 'ada@example.com',
    amountCents: 1250,
    spentOn: '2026-01-10',
    categoryId: 'category-1',
  });
  return context;
}

describe('DeleteExpenseHandler', () => {
  it('deletes an expense the user owns', async () => {
    const { expenses, remove } = await seeded();

    const result = await remove.execute({ expenseId: 'expense-1', userEmail: 'ada@example.com' });

    expect(result.ok).toBe(true);
    expect(await expenses.listByOwner(ada)).toEqual([]);
  });

  it('refuses an expense the user does not own', async () => {
    const { expenses, remove } = await seeded();

    const result = await remove.execute({ expenseId: 'expense-1', userEmail: 'grace@example.com' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseNotFound');
    expect(await expenses.listByOwner(ada)).toHaveLength(1);
  });

  it('refuses an expense that does not exist', async () => {
    const { remove } = await seeded();

    const result = await remove.execute({ expenseId: 'missing', userEmail: 'ada@example.com' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('ExpenseNotFound');
  });

  it('refuses an address that is not an email', async () => {
    const { remove } = await seeded();

    const result = await remove.execute({ expenseId: 'expense-1', userEmail: 'ada' });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.kind).toBe('InvalidEmail');
  });
});