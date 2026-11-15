import type { ExpenseCategoryDto } from '../application/dto/expense-category.dto';
import type { ExpenseSubcategoryDto } from '../application/dto/expense-subcategory.dto';
import { ExpenseCategory } from '../domain/expense-category.aggregate';
import { ExpenseCategoryName } from '../domain/expense-category-name.value-object';
import { Email } from '../domain/email.value-object';
import { ExpenseSubcategory } from '../domain/expense-subcategory.entity';
import { ExpenseSubcategoryName } from '../domain/expense-subcategory-name.value-object';
import type { ExpenseCategoryRow, ExpenseSubcategoryRow } from './expense-category.model';

export const expenseCategoryMapper = {
  toDomain(row: ExpenseCategoryRow, subcategories: readonly ExpenseSubcategoryRow[] = []): ExpenseCategory {
    return ExpenseCategory.reconstitute({
      id: row.id,
      name: ExpenseCategoryName.reconstitute(row.name),
      ownerEmail: Email.reconstitute(row.ownerEmail),
      createdAt: row.createdAt,
      subcategories: subcategories.map(expenseSubcategoryMapper.toDomain),
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

export const expenseSubcategoryMapper = {
  toDomain(row: ExpenseSubcategoryRow): ExpenseSubcategory {
    return ExpenseSubcategory.reconstitute({
      id: row.id,
      name: ExpenseSubcategoryName.reconstitute(row.name),
    });
  },

  toRow(subcategory: ExpenseSubcategory, categoryId: string): ExpenseSubcategoryRow {
    const snapshot = subcategory.toSnapshot();
    return { id: snapshot.id, categoryId, name: snapshot.name.value };
  },

  toDto(row: ExpenseSubcategoryRow): ExpenseSubcategoryDto {
    return { id: row.id, name: row.name };
  },
};