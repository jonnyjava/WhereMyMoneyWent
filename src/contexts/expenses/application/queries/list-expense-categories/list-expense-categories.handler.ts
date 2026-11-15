import { ok, type Result } from '@/shared/result';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type { ExpenseCategoryDto } from '../../dto/expense-category.dto';
import type { ExpenseCategoryReadPort } from '../../ports/expense-category-read.port';
import type { ListExpenseCategoriesQuery } from './list-expense-categories.query';

export type ListExpenseCategoriesError = InvalidEmail;

export class ListExpenseCategoriesHandler {
  constructor(private readonly reads: ExpenseCategoryReadPort) {}

  async execute(
    query: ListExpenseCategoriesQuery,
  ): Promise<Result<ExpenseCategoryDto[], ListExpenseCategoriesError>> {
    const ownerEmail = Email.create(query.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    return ok(await this.reads.listByOwner(ownerEmail.value));
  }
}