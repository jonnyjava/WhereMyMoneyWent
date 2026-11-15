import { err, type Result } from '@/shared/result';
import type { ExpenseCategoryNameAlreadyExists } from '../../../domain/expense-category.error';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type {
  ExpenseSubcategoryNotFound,
  InvalidSubcategoryName,
  SubcategoryNameAlreadyExists,
} from '../../../domain/expense-subcategory.error';
import type { ExpenseCategoryRepository } from '../../../domain/expense-category.repository';
import { expenseCategoryNotFound, type ExpenseCategoryNotFound } from '../../errors/expense-category-not-found.error';
import type { RenameExpenseSubcategoryCommand } from './rename-expense-subcategory.command';

export type RenameExpenseSubcategoryError =
  | InvalidEmail
  | ExpenseCategoryNotFound
  | ExpenseCategoryNameAlreadyExists
  | ExpenseSubcategoryNotFound
  | InvalidSubcategoryName
  | SubcategoryNameAlreadyExists;

export class RenameExpenseSubcategoryHandler {
  constructor(private readonly categories: ExpenseCategoryRepository) {}

  async execute(command: RenameExpenseSubcategoryCommand): Promise<Result<void, RenameExpenseSubcategoryError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const category = await this.categories.findOwned(command.categoryId, ownerEmail.value);
    if (category === null) return err(expenseCategoryNotFound(command.categoryId));

    const renamed = category.renameSubcategory(command.subcategoryId, command.name);
    if (!renamed.ok) return renamed;

    return this.categories.save(category);
  }
}