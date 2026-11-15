import { err, type Result } from '@/shared/result';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type {
  ExpenseCategoryNameAlreadyExists,
  InvalidCategoryName,
} from '../../../domain/expense-category.error';
import type { ExpenseCategoryRepository } from '../../../domain/expense-category.repository';
import { expenseCategoryNotFound, type ExpenseCategoryNotFound } from '../../errors/expense-category-not-found.error';
import type { RenameExpenseCategoryCommand } from './rename-expense-category.command';

export type RenameExpenseCategoryError =
  | InvalidEmail
  | ExpenseCategoryNotFound
  | InvalidCategoryName
  | ExpenseCategoryNameAlreadyExists;

export class RenameExpenseCategoryHandler {
  constructor(private readonly categories: ExpenseCategoryRepository) {}

  async execute(command: RenameExpenseCategoryCommand): Promise<Result<void, RenameExpenseCategoryError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const found = await this.categories.findOwned(command.categoryId, ownerEmail.value);
    if (found === null) return err(expenseCategoryNotFound(command.categoryId));

    const renamed = found.rename(command.name);
    if (!renamed.ok) return renamed;

    return this.categories.save(found);
  }
}