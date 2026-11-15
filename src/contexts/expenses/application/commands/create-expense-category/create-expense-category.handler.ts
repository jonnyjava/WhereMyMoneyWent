import type { Clock } from '@/shared/clock';
import { ok, type Result } from '@/shared/result';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import { ExpenseCategory } from '../../../domain/expense-category.aggregate';
import type {
  ExpenseCategoryNameAlreadyExists,
  InvalidCategoryName,
} from '../../../domain/expense-category.error';
import type { ExpenseCategoryRepository } from '../../../domain/expense-category.repository';
import type { ExpenseCategoryDto } from '../../dto/expense-category.dto';
import type { CreateExpenseCategoryCommand } from './create-expense-category.command';

export type CreateExpenseCategoryError =
  | InvalidEmail
  | InvalidCategoryName
  | ExpenseCategoryNameAlreadyExists;

export class CreateExpenseCategoryHandler {
  constructor(
    private readonly categories: ExpenseCategoryRepository,
    private readonly clock: Clock,
  ) {}

  /** Creates a category owned by the requesting user and returns it. */
  async execute(
    command: CreateExpenseCategoryCommand,
  ): Promise<Result<ExpenseCategoryDto, CreateExpenseCategoryError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const category = ExpenseCategory.create(
      { id: command.categoryId, name: command.name, ownerEmail: ownerEmail.value },
      this.clock(),
    );
    if (!category.ok) return category;

    const saved = await this.categories.save(category.value);
    if (!saved.ok) return saved;

    return ok({ id: category.value.id, name: category.value.name.value });
  }
}