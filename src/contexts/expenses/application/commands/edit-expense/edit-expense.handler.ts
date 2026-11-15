import { err, type Result } from '@/shared/result';
import type { Clock } from '@/shared/clock';
import type { InvalidAmount } from '../../../domain/expense-amount.error';
import type { ExpenseCategoryHasSubcategories } from '../../../domain/expense-category.error';
import type { InvalidExpenseDate } from '../../../domain/expense-date.error';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type { ExpenseSubcategoryNotFound } from '../../../domain/expense-subcategory.error';
import { targetFrom } from '../../../domain/expense-target.value-object';
import type { ExpenseRepository } from '../../../domain/expense.repository';
import type { ExpenseCategoryRepository } from '../../../domain/expense-category.repository';
import { expenseCategoryNotFound, type ExpenseCategoryNotFound } from '../../errors/expense-category-not-found.error';
import { expenseNotFound, type ExpenseNotFound } from '../../errors/expense-not-found.error';
import type { EditExpenseCommand } from './edit-expense.command';

export type EditExpenseError =
  | InvalidEmail
  | ExpenseNotFound
  | ExpenseCategoryNotFound
  | ExpenseCategoryHasSubcategories
  | ExpenseSubcategoryNotFound
  | InvalidAmount
  | InvalidExpenseDate;

export class EditExpenseHandler {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly categories: ExpenseCategoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(command: EditExpenseCommand): Promise<Result<void, EditExpenseError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const expense = await this.expenses.findOwned(command.expenseId, ownerEmail.value);
    if (expense === null) return err(expenseNotFound(command.expenseId));

    const target = targetFrom(command.categoryId, command.subcategoryId);
    const category = await this.categories.findOwned(target.categoryId, ownerEmail.value);
    if (category === null) return err(expenseCategoryNotFound(target.categoryId));

    const allowed = category.validateTarget(target);
    if (!allowed.ok) return allowed;

    const edited = expense.edit(
      { amountCents: command.amountCents, spentOn: command.spentOn, target },
      this.clock(),
    );
    if (!edited.ok) return edited;

    await this.expenses.save(expense);
    return edited;
  }
}