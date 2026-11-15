import { err, ok, type Result } from '@/shared/result';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type { ExpenseCategoryRepository } from '../../../domain/expense-category.repository';
import { expenseCategoryNotFound, type ExpenseCategoryNotFound } from '../../errors/expense-category-not-found.error';
import type { DeleteExpenseCategoryCommand } from './delete-expense-category.command';

export type DeleteExpenseCategoryError = InvalidEmail | ExpenseCategoryNotFound;

export class DeleteExpenseCategoryHandler {
  constructor(private readonly categories: ExpenseCategoryRepository) {}

  async execute(command: DeleteExpenseCategoryCommand): Promise<Result<void, DeleteExpenseCategoryError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const deleted = await this.categories.deleteOwned(command.categoryId, ownerEmail.value);
    return deleted ? ok(undefined) : err(expenseCategoryNotFound(command.categoryId));
  }
}