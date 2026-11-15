import type { Email } from '../../domain/email.value-object';
import type { ExpenseDto } from '../dto/expense.dto';

/** Read port for queries: reads straight from storage, bypassing aggregates. */
export interface ExpenseReadPort {
  listByOwner(ownerEmail: Email): Promise<ExpenseDto[]>;
}