import { err, ok, type Result } from '@/shared/result';
import type { ExpenseCategoryNameAlreadyExists } from '../../../domain/expense-category.error';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type {
  InvalidSubcategoryName,
  SubcategoryNameAlreadyExists,
} from '../../../domain/expense-subcategory.error';
import type { ExpenseCategoryRepository } from '../../../domain/expense-category.repository';
import type { ExpenseSubcategoryDto } from '../../dto/expense-subcategory.dto';
import { expenseCategoryNotFound, type ExpenseCategoryNotFound } from '../../errors/expense-category-not-found.error';
import type { CreateExpenseSubcategoryCommand } from './create-expense-subcategory.command';

export type CreateExpenseSubcategoryError =
  | InvalidEmail
  | ExpenseCategoryNotFound
  | ExpenseCategoryNameAlreadyExists
  | InvalidSubcategoryName
  | SubcategoryNameAlreadyExists;

export class CreateExpenseSubcategoryHandler {
  constructor(private readonly categories: ExpenseCategoryRepository) {}

  /** Adds a subcategory to a category the user owns and returns it. */
  async execute(
    command: CreateExpenseSubcategoryCommand,
  ): Promise<Result<ExpenseSubcategoryDto, CreateExpenseSubcategoryError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const category = await this.categories.findOwned(command.categoryId, ownerEmail.value);
    if (category === null) return err(expenseCategoryNotFound(command.categoryId));

    const added = category.addSubcategory({ id: command.subcategoryId, name: command.name });
    if (!added.ok) return added;

    const saved = await this.categories.save(category);
    if (!saved.ok) return saved;

    return ok({ id: added.value.id, name: added.value.name.value });
  }
}