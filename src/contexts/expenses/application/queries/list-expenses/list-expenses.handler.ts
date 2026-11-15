import { ok, type Result } from '@/shared/result';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type { ExpenseDto } from '../../dto/expense.dto';
import type { ExpenseReadPort } from '../../ports/expense-read.port';
import type { ListExpensesQuery } from './list-expenses.query';

export type ListExpensesError = InvalidEmail;

export class ListExpensesHandler {
  constructor(private readonly reads: ExpenseReadPort) {}

  async execute(query: ListExpensesQuery): Promise<Result<ExpenseDto[], ListExpensesError>> {
    const ownerEmail = Email.create(query.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    return ok(await this.reads.listByOwner(ownerEmail.value));
  }
}