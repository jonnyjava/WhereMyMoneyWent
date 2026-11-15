import { describe, expect, it } from 'vitest';
import {
  createCategoryMessage,
  deleteCategoryMessage,
  invalidEmailMessage,
  renameCategoryMessage,
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