import type { ExpenseDto } from '../application/dto/expense.dto';
import { Expense } from '../domain/expense.aggregate';
import { ExpenseAmount } from '../domain/expense-amount.value-object';
import { ExpenseDate } from '../domain/expense-date.value-object';
import { Email } from '../domain/email.value-object';
import { categoryTarget, subcategoryTarget } from '../domain/expense-target.value-object';
import type { ExpenseRow } from './expense.model';

export const expenseMapper = {
  toDomain(row: ExpenseRow): Expense {
    return Expense.reconstitute({
      id: row.id,
      amount: ExpenseAmount.reconstitute(row.amountCents),
      spentOn: ExpenseDate.reconstitute(row.spentOn),
      target:
        row.subcategoryId === null
          ? categoryTarget(row.categoryId)
          : subcategoryTarget(row.categoryId, row.subcategoryId),
      ownerEmail: Email.reconstitute(row.ownerEmail),
      createdAt: row.createdAt,
    });
  },

  toRow(expense: Expense): ExpenseRow {
    const snapshot = expense.toSnapshot();
    return {
      id: snapshot.id,
      ownerEmail: snapshot.ownerEmail.value,
      amountCents: snapshot.amount.cents,
      spentOn: snapshot.spentOn.value,
      categoryId: snapshot.target.categoryId,
      subcategoryId: snapshot.target.kind === 'subcategory' ? snapshot.target.subcategoryId : null,
      createdAt: snapshot.createdAt,
    };
  },

  toDto(row: ExpenseRow): ExpenseDto {
    return {
      id: row.id,
      amountCents: row.amountCents,
      spentOn: row.spentOn,
      categoryId: row.categoryId,
      subcategoryId: row.subcategoryId,
      ownerEmail: row.ownerEmail,
    };
  },
};