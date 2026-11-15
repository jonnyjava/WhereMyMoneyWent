import type { Email } from '../../domain/email.value-object';
import type { ExpenseCategoryDto } from '../dto/expense-category.dto';

/** Read port for queries: reads straight from storage, bypassing aggregates. */
export interface ExpenseCategoryReadPort {
  listByOwner(ownerEmail: Email): Promise<ExpenseCategoryDto[]>;
}