import { err, ok, type Result } from '@/shared/result';
import type { InvalidEmail } from '../../../domain/email.error';
import { Email } from '../../../domain/email.value-object';
import type { ExpenseRepository } from '../../../domain/expense.repository';
import { expenseNotFound, type ExpenseNotFound } from '../../errors/expense-not-found.error';
import type { DeleteExpenseCommand } from './delete-expense.command';

export type DeleteExpenseError = InvalidEmail | ExpenseNotFound;

export class DeleteExpenseHandler {
  constructor(private readonly expenses: ExpenseRepository) {}

  async execute(command: DeleteExpenseCommand): Promise<Result<void, DeleteExpenseError>> {
    const ownerEmail = Email.create(command.userEmail);
    if (!ownerEmail.ok) return ownerEmail;

    const deleted = await this.expenses.deleteOwned(command.expenseId, ownerEmail.value);
    return deleted ? ok(undefined) : err(expenseNotFound(command.expenseId));
  }
}