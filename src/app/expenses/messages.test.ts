import { describe, expect, it } from 'vitest';
import {
  createCategoryMessage,
  createSubcategoryMessage,
  deleteCategoryMessage,
  deleteSubcategoryMessage,
  invalidEmailMessage,
  listSubcategoriesMessage,
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