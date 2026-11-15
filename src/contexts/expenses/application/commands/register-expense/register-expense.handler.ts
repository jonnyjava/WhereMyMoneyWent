import { err, ok, type Result } from '@/shared/result';
import type { Clock } from '@/shared/clock';
import type { InvalidAmount } from '../../../domain/expense-amount.error';
import type { ExpenseCategoryHasSubcategories } from '../../../domain/expense-category.error';
import type { InvalidExpenseDate } from '../../../domain/expense-date.error';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import { Expense } from '../../../domain/expense.aggregate';
import type { ExpenseSubcategoryNotFound } from '../../../domain/expense-subcategory.error';
import { targetFrom } from '../../../domain/expense-target.value-object';
import type { ExpenseRepository } from '../../../domain/expense.repository';
import type { ExpenseCategoryRepository } from '../../../domain/expense-category.repository';
import { expenseCategoryNotFound, type ExpenseCategoryNotFound } from '../../errors/expense-category-not-found.error';
import type { RegisterExpenseCommand } from './register-expense.command';

export type RegisterExpenseError =
  | InvalidEmail
  | ExpenseCategoryNotFound
  | ExpenseCategoryHasSubcategories
  | ExpenseSubcategoryNotFound
  | InvalidAmount
  | InvalidExpenseDate;

export class RegisterExpenseHandler {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly categories: ExpenseCategoryRepository,
    private readonly clock: Clock,
  ) {}

  /** Registers an expense for the requesting user and returns its id. */
  async execute(command: RegisterExpenseCommand): Promise<Result<string, RegisterExpenseError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const target = targetFrom(command.categoryId, command.subcategoryId);
    const category = await this.categories.findOwned(target.categoryId, ownerEmail.value);
    if (category === null) return err(expenseCategoryNotFound(target.categoryId));

    const allowed = category.validateTarget(target);
    if (!allowed.ok) return allowed;

    const now = this.clock();
    const expense = Expense.create(
      {
        id: command.expenseId,
        amountCents: command.amountCents,
        spentOn: command.spentOn,
        target,
        ownerEmail: ownerEmail.value,
      },
      now,
    );
    if (!expense.ok) return expense;

    await this.expenses.save(expense.value);
    return ok(expense.value.id);
  }
}