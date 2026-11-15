// Public API of the "expenses" context.
// Export only commands, queries, DTOs, error types and event types.
// Never aggregates, entities, value objects or repositories.
export type { CreateExpenseCategoryCommand } from './application/commands/create-expense-category/create-expense-category.command';
export type { CreateExpenseCategoryError } from './application/commands/create-expense-category/create-expense-category.handler';
export type { RenameExpenseCategoryCommand } from './application/commands/rename-expense-category/rename-expense-category.command';
export type { RenameExpenseCategoryError } from './application/commands/rename-expense-category/rename-expense-category.handler';
export type { DeleteExpenseCategoryCommand } from './application/commands/delete-expense-category/delete-expense-category.command';
export type { DeleteExpenseCategoryError } from './application/commands/delete-expense-category/delete-expense-category.handler';
export type { ListExpenseCategoriesQuery } from './application/queries/list-expense-categories/list-expense-categories.query';
export type { ListExpenseCategoriesError } from './application/queries/list-expense-categories/list-expense-categories.handler';
export type { ExpenseCategoryDto } from './application/dto/expense-category.dto';
export type { ExpenseCategoryNotFound } from './application/errors/expense-category-not-found.error';
export type { InvalidEmail } from './domain/email.error';
export type {
  ExpenseCategoryNameAlreadyExists,
  InvalidCategoryName,
} from './domain/expense-category.error';