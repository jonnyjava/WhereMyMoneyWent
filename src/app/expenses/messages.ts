import type {
  CreateExpenseCategoryError,
  DeleteExpenseCategoryError,
  RenameExpenseCategoryError,
} from '@/contexts/expenses';
import { assertNever } from '@/shared/assert-never';

// What a person reads when something goes wrong. Every error kind must be handled:
// adding one to the context fails the typechecker here until its message is written.
// Say what happened and what to do next, in plain words. Never show the error object.

export function createCategoryMessage(error: CreateExpenseCategoryError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'InvalidCategoryName':
      return invalidCategoryNameMessage();
    case 'ExpenseCategoryNameAlreadyExists':
      return categoryNameAlreadyExistsMessage();
    default:
      return assertNever(error);
  }
}

export function renameCategoryMessage(error: RenameExpenseCategoryError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseCategoryNotFound':
      return expenseCategoryNotFoundMessage();
    case 'InvalidCategoryName':
      return invalidCategoryNameMessage();
    case 'ExpenseCategoryNameAlreadyExists':
      return categoryNameAlreadyExistsMessage();
    default:
      return assertNever(error);
  }
}

export function deleteCategoryMessage(error: DeleteExpenseCategoryError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseCategoryNotFound':
      return expenseCategoryNotFoundMessage();
    default:
      return assertNever(error);
  }
}

export function invalidEmailMessage(): string {
  return 'That email address does not look right. Check it and try again.';
}

export function invalidCategoryNameMessage(): string {
  return 'Enter a name for the category, using 80 characters at most.';
}

export function categoryNameAlreadyExistsMessage(): string {
  return 'You already have a category with that name. Choose another name.';
}

export function expenseCategoryNotFoundMessage(): string {
  return 'That category no longer exists. Refresh the page to see your categories.';
}