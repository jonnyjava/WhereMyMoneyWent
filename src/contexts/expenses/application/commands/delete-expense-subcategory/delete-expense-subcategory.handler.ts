import { err, type Result } from '@/shared/result';
import type { ExpenseCategoryNameAlreadyExists } from '../../../domain/expense-category.error';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type { ExpenseSubcategoryNotFound } from '../../../domain/expense-subcategory.error';
import type { ExpenseCategoryRepository } from '../../../domain/expense-category.repository';
import { expenseCategoryNotFound, type ExpenseCategoryNotFound } from '../../errors/expense-category-not-found.error';
import type { DeleteExpenseSubcategoryCommand } from './delete-expense-subcategory.command';

export type DeleteExpenseSubcategoryError =
  | InvalidEmail
  | ExpenseCategoryNotFound
  | ExpenseCategoryNameAlreadyExists
  | ExpenseSubcategoryNotFound;

export class DeleteExpenseSubcategoryHandler {
  constructor(private readonly categories: ExpenseCategoryRepository) {}

  async execute(
    command: DeleteExpenseSubcategoryCommand,
  ): Promise<Result<void, DeleteExpenseSubcategoryError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const category = await this.categories.findOwned(command.categoryId, ownerEmail.value);
    if (category === null) return err(expenseCategoryNotFound(command.categoryId));

    const removed = category.removeSubcategory(command.subcategoryId);
    if (!removed.ok) return removed;

    return this.categories.save(category);
  }
}