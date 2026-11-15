import { err, ok, type Result } from '@/shared/result';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type { ExpenseSubcategoryDto } from '../../dto/expense-subcategory.dto';
import { expenseCategoryNotFound, type ExpenseCategoryNotFound } from '../../errors/expense-category-not-found.error';
import type { ExpenseCategoryReadPort } from '../../ports/expense-category-read.port';
import type { ListExpenseSubcategoriesQuery } from './list-expense-subcategories.query';

export type ListExpenseSubcategoriesError = InvalidEmail | ExpenseCategoryNotFound;

export class ListExpenseSubcategoriesHandler {
  constructor(private readonly reads: ExpenseCategoryReadPort) {}

  async execute(
    query: ListExpenseSubcategoriesQuery,
  ): Promise<Result<ExpenseSubcategoryDto[], ListExpenseSubcategoriesError>> {
    const ownerEmail = Email.create(query.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const subcategories = await this.reads.listSubcategories(query.categoryId, ownerEmail.value);
    if (subcategories === null) return err(expenseCategoryNotFound(query.categoryId));

    return ok(subcategories);
  }
}