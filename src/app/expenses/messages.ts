import type {
  CreateExpenseCategoryError,
  CreateExpenseSubcategoryError,
  DeleteExpenseCategoryError,
  DeleteExpenseError,
  DeleteExpenseSubcategoryError,
  EditExpenseError,
  ListExpenseSubcategoriesError,
  RegisterExpenseError,
  RenameExpenseCategoryError,
  RenameExpenseSubcategoryError,
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

export function createSubcategoryMessage(error: CreateExpenseSubcategoryError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseCategoryNotFound':
      return expenseCategoryNotFoundMessage();
    case 'ExpenseCategoryNameAlreadyExists':
      return expenseCategorySaveFailedMessage();
    case 'InvalidSubcategoryName':
      return invalidSubcategoryNameMessage();
    case 'SubcategoryNameAlreadyExists':
      return subcategoryNameAlreadyExistsMessage();
    default:
      return assertNever(error);
  }
}

export function renameSubcategoryMessage(error: RenameExpenseSubcategoryError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseCategoryNotFound':
      return expenseCategoryNotFoundMessage();
    case 'ExpenseCategoryNameAlreadyExists':
      return expenseCategorySaveFailedMessage();
    case 'ExpenseSubcategoryNotFound':
      return expenseSubcategoryNotFoundMessage();
    case 'InvalidSubcategoryName':
      return invalidSubcategoryNameMessage();
    case 'SubcategoryNameAlreadyExists':
      return subcategoryNameAlreadyExistsMessage();
    default:
      return assertNever(error);
  }
}

export function deleteSubcategoryMessage(error: DeleteExpenseSubcategoryError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseCategoryNotFound':
      return expenseCategoryNotFoundMessage();
    case 'ExpenseCategoryNameAlreadyExists':
      return expenseCategorySaveFailedMessage();
    case 'ExpenseSubcategoryNotFound':
      return expenseSubcategoryNotFoundMessage();
    default:
      return assertNever(error);
  }
}

export function listSubcategoriesMessage(error: ListExpenseSubcategoriesError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseCategoryNotFound':
      return expenseCategoryNotFoundMessage();
    default:
      return assertNever(error);
  }
}

export function registerExpenseMessage(error: RegisterExpenseError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseCategoryNotFound':
      return expenseCategoryNotFoundMessage();
    case 'ExpenseCategoryHasSubcategories':
      return expenseCategoryHasSubcategoriesMessage();
    case 'ExpenseSubcategoryNotFound':
      return expenseSubcategoryNotFoundMessage();
    case 'InvalidAmount':
      return invalidAmountMessage();
    case 'InvalidExpenseDate':
      return invalidExpenseDateMessage();
    default:
      return assertNever(error);
  }
}

export function editExpenseMessage(error: EditExpenseError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseNotFound':
      return expenseNotFoundMessage();
    case 'ExpenseCategoryNotFound':
      return expenseCategoryNotFoundMessage();
    case 'ExpenseCategoryHasSubcategories':
      return expenseCategoryHasSubcategoriesMessage();
    case 'ExpenseSubcategoryNotFound':
      return expenseSubcategoryNotFoundMessage();
    case 'InvalidAmount':
      return invalidAmountMessage();
    case 'InvalidExpenseDate':
      return invalidExpenseDateMessage();
    default:
      return assertNever(error);
  }
}

export function deleteExpenseMessage(error: DeleteExpenseError): string {
  switch (error.kind) {
    case 'InvalidEmail':
      return invalidEmailMessage();
    case 'ExpenseNotFound':
      return expenseNotFoundMessage();
    default:
      return assertNever(error);
  }
}

// Listing expenses has a single possible failure today: a request without a usable user.
// There is no union to be exhaustive over, so this is a plain function.
export function listExpensesMessage(): string {
  return invalidEmailMessage();
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

export function expenseCategorySaveFailedMessage(): string {
  return 'That category could not be saved because another category already uses its name. Refresh the page and try again.';
}

export function invalidSubcategoryNameMessage(): string {
  return 'Enter a name for the subcategory, using 80 characters at most.';
}

export function subcategoryNameAlreadyExistsMessage(): string {
  return 'This category already has a subcategory with that name. Choose another name.';
}

export function expenseSubcategoryNotFoundMessage(): string {
  return 'That subcategory no longer exists. Refresh the page to see your subcategories.';
}

export function invalidAmountMessage(): string {
  return 'Enter an amount greater than 0.';
}

export function invalidExpenseDateMessage(): string {
  return 'Enter a real date for the expense.';
}

export function expenseNotFoundMessage(): string {
  return 'That expense no longer exists. Refresh the page to see your expenses.';
}

export function expenseCategoryHasSubcategoriesMessage(): string {
  return 'That category still has expense-subcategories. Choose one of them, or pick another category.';
}