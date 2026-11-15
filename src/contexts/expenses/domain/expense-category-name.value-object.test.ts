import { describe, expect, it } from 'vitest';
import { ExpenseCategoryName } from './expense-category-name.value-object';

describe('ExpenseCategoryName', () => {
  it('trims the name and collapses repeated inner whitespace', () => {
    const name = ExpenseCategoryName.create('  Home   cooking ');

    expect(name.ok && name.value.value).toBe('Home cooking');
  });

  it('refuses an empty name', () => {
    expect(ExpenseCategoryName.create('   ').ok).toBe(false);
    expect(ExpenseCategoryName.create('').ok).toBe(false);
  });

  it('refuses a name longer than 80 characters', () => {
    expect(ExpenseCategoryName.create('a'.repeat(81)).ok).toBe(false);
    expect(ExpenseCategoryName.create('a'.repeat(80)).ok).toBe(true);
  });

  it('compares two names by value', () => {
    const one = ExpenseCategoryName.create('Food');
    const same = ExpenseCategoryName.create(' Food ');
    const other = ExpenseCategoryName.create('Rent');

    expect(one.ok && same.ok && one.value.equals(same.value)).toBe(true);
    expect(one.ok && other.ok && one.value.equals(other.value)).toBe(false);
  });
});