import type { ExpenseCategoryDto } from '../application/dto/expense-category.dto';
import { ExpenseCategory } from '../domain/expense-category.aggregate';
import { ExpenseCategoryName } from '../domain/expense-category-name.value-object';
import { Email } from '../domain/email.value-object';
import type { ExpenseCategoryRow } from './expense-category.model';

export const expenseCategoryMapper = {
  toDomain(row: ExpenseCategoryRow): ExpenseCategory {
    return ExpenseCategory.reconstitute({
      id: row.id,
      name: ExpenseCategoryName.reconstitute(row.name),
      ownerEmail: Email.reconstitute(row.ownerEmail),
      createdAt: row.createdAt,
    });
  },

  toRow(category: ExpenseCategory): ExpenseCategoryRow {
    const snapshot = category.toSnapshot();
    return {
      id: snapshot.id,
      ownerEmail: snapshot.ownerEmail.value,
      name: snapshot.name.value,
      createdAt: snapshot.createdAt,
    };
  },

  toDto(row: ExpenseCategoryRow): ExpenseCategoryDto {
    return { id: row.id, name: row.name };
  },
};