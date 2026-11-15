import { describe, expect, it } from 'vitest';
import {
  createCategoryMessage,
  createSubcategoryMessage,
  deleteCategoryMessage,
  deleteExpenseMessage,
  deleteSubcategoryMessage,
  editExpenseMessage,
  invalidEmailMessage,
  listExpensesMessage,
  listSubcategoriesMessage,
  registerExpenseMessage,
  renameCategoryMessage,
  renameSubcategoryMessage,
} from './messages';

describe('expense-category error messages', () => {
  it('every failure of creating a category has a plain message', () => {
    expect(createCategoryMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(createCategoryMessage({ kind: 'InvalidCategoryName', input: 'x' })).toMatch(/name for the category/);
    expect(createCategoryMessage({ kind: 'ExpenseCategoryNameAlreadyExists', name: 'Food' })).toMatch(
      /already have a category with that name/,
    );
  });

  it('every failure of renaming a category has a plain message', () => {
    expect(renameCategoryMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(renameCategoryMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'x' })).toMatch(
      /no longer exists/,
    );
    expect(renameCategoryMessage({ kind: 'InvalidCategoryName', input: 'x' })).toMatch(/name for the category/);
    expect(renameCategoryMessage({ kind: 'ExpenseCategoryNameAlreadyExists', name: 'Food' })).toMatch(
      /already have a category with that name/,
    );
  });

  it('every failure of deleting a category has a plain message', () => {
    expect(deleteCategoryMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(deleteCategoryMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'x' })).toMatch(
      /no longer exists/,
    );
  });

  it('never shows internals: no ids, no input, no braces, no error kinds', () => {
    const all = [
      createCategoryMessage({ kind: 'InvalidEmail', input: 'secret@example.com' }),
      createCategoryMessage({ kind: 'ExpenseCategoryNameAlreadyExists', name: 'Food' }),
      renameCategoryMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'abc-123' }),
      deleteCategoryMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'abc-123' }),
      invalidEmailMessage(),
    ];
    for (const message of all) {
      expect(message).not.toMatch(/abc-123|secret@example\.com|[{}]|InvalidEmail|ExpenseCategoryNotFound/);
    }
  });
});

describe('expense-subcategory error messages', () => {
  it('every failure of creating a subcategory has a plain message', () => {
    expect(createSubcategoryMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(createSubcategoryMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'x' })).toMatch(
      /no longer exists/,
    );
    expect(createSubcategoryMessage({ kind: 'ExpenseCategoryNameAlreadyExists', name: 'Food' })).toMatch(
      /could not be saved/,
    );
    expect(createSubcategoryMessage({ kind: 'InvalidSubcategoryName', input: 'x' })).toMatch(
      /name for the subcategory/,
    );
    expect(createSubcategoryMessage({ kind: 'SubcategoryNameAlreadyExists', name: 'Food' })).toMatch(
      /already has a subcategory with that name/,
    );
  });

  it('every failure of renaming a subcategory has a plain message', () => {
    expect(renameSubcategoryMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(renameSubcategoryMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'x' })).toMatch(
      /no longer exists/,
    );
    expect(renameSubcategoryMessage({ kind: 'ExpenseCategoryNameAlreadyExists', name: 'Food' })).toMatch(
      /could not be saved/,
    );
    expect(renameSubcategoryMessage({ kind: 'ExpenseSubcategoryNotFound', subcategoryId: 'x' })).toMatch(
      /subcategory no longer exists/,
    );
    expect(renameSubcategoryMessage({ kind: 'InvalidSubcategoryName', input: 'x' })).toMatch(
      /name for the subcategory/,
    );
    expect(renameSubcategoryMessage({ kind: 'SubcategoryNameAlreadyExists', name: 'Food' })).toMatch(
      /already has a subcategory with that name/,
    );
  });

  it('every failure of deleting a subcategory has a plain message', () => {
    expect(deleteSubcategoryMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(deleteSubcategoryMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'x' })).toMatch(
      /no longer exists/,
    );
    expect(deleteSubcategoryMessage({ kind: 'ExpenseCategoryNameAlreadyExists', name: 'Food' })).toMatch(
      /could not be saved/,
    );
    expect(deleteSubcategoryMessage({ kind: 'ExpenseSubcategoryNotFound', subcategoryId: 'x' })).toMatch(
      /subcategory no longer exists/,
    );
  });

  it('every failure of listing subcategories has a plain message', () => {
    expect(listSubcategoriesMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(listSubcategoriesMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'x' })).toMatch(
      /no longer exists/,
    );
  });

  it('never shows internals: no ids, no input, no braces, no error kinds', () => {
    const all = [
      createSubcategoryMessage({ kind: 'SubcategoryNameAlreadyExists', name: 'Food' }),
      renameSubcategoryMessage({ kind: 'ExpenseSubcategoryNotFound', subcategoryId: 'abc-123' }),
      deleteSubcategoryMessage({ kind: 'ExpenseSubcategoryNotFound', subcategoryId: 'abc-123' }),
      listSubcategoriesMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'abc-123' }),
    ];
    for (const message of all) {
      expect(message).not.toMatch(/abc-123|[{}]|InvalidEmail|ExpenseCategoryNotFound|ExpenseSubcategoryNotFound/);
    }
  });
});
describe('expense error messages', () => {
  it('every failure of registering an expense has a plain message', () => {
    expect(registerExpenseMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(registerExpenseMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'x' })).toMatch(
      /no longer exists/,
    );
    expect(registerExpenseMessage({ kind: 'ExpenseCategoryHasSubcategories', categoryId: 'x' })).toMatch(
      /still has expense-subcategories/,
    );
    expect(registerExpenseMessage({ kind: 'ExpenseSubcategoryNotFound', subcategoryId: 'x' })).toMatch(
      /subcategory no longer exists/,
    );
    expect(registerExpenseMessage({ kind: 'InvalidAmount', cents: 0 })).toMatch(/greater than 0/);
    expect(registerExpenseMessage({ kind: 'InvalidExpenseDate', input: 'x' })).toMatch(/real date/);
  });

  it('every failure of editing an expense has a plain message', () => {
    expect(editExpenseMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(editExpenseMessage({ kind: 'ExpenseNotFound', expenseId: 'x' })).toMatch(/expense no longer exists/);
    expect(editExpenseMessage({ kind: 'ExpenseCategoryNotFound', categoryId: 'x' })).toMatch(
      /no longer exists/,
    );
    expect(editExpenseMessage({ kind: 'ExpenseCategoryHasSubcategories', categoryId: 'x' })).toMatch(
      /still has expense-subcategories/,
    );
    expect(editExpenseMessage({ kind: 'ExpenseSubcategoryNotFound', subcategoryId: 'x' })).toMatch(
      /subcategory no longer exists/,
    );
    expect(editExpenseMessage({ kind: 'InvalidAmount', cents: 0 })).toMatch(/greater than 0/);
    expect(editExpenseMessage({ kind: 'InvalidExpenseDate', input: 'x' })).toMatch(/real date/);
  });

  it('every failure of deleting an expense has a plain message', () => {
    expect(deleteExpenseMessage({ kind: 'InvalidEmail', input: 'x' })).toMatch(/email address/);
    expect(deleteExpenseMessage({ kind: 'ExpenseNotFound', expenseId: 'x' })).toMatch(
      /expense no longer exists/,
    );
  });

  it('listing expenses without a usable user has a plain message', () => {
    expect(listExpensesMessage()).toMatch(/email address/);
  });

  it('never shows internals: no ids, no input, no braces, no error kinds', () => {
    const all = [
      registerExpenseMessage({ kind: 'ExpenseCategoryHasSubcategories', categoryId: 'abc-123' }),
      editExpenseMessage({ kind: 'ExpenseNotFound', expenseId: 'abc-123' }),
      deleteExpenseMessage({ kind: 'ExpenseNotFound', expenseId: 'abc-123' }),
      registerExpenseMessage({ kind: 'InvalidExpenseDate', input: 'secret' }),
      listExpensesMessage(),
    ];
    for (const message of all) {
      expect(message).not.toMatch(
        /abc-123|secret|[{}]|InvalidEmail|ExpenseNotFound|ExpenseCategoryNotFound|ExpenseCategoryHasSubcategories|ExpenseSubcategoryNotFound|InvalidAmount|InvalidExpenseDate/,
      );
    }
  });
});
