import { describe, expect, it } from 'vitest';
import { ExpenseSubcategoryName } from './expense-subcategory-name.value-object';

describe('ExpenseSubcategoryName', () => {
  it('trims the name and collapses repeated inner whitespace', () => {
    const name = ExpenseSubcategoryName.create('  Fresh   food ');

    expect(name.ok && name.value.value).toBe('Fresh food');
  });

  it('refuses an empty name', () => {
    expect(ExpenseSubcategoryName.create('').ok).toBe(false);
    expect(ExpenseSubcategoryName.create('   ').ok).toBe(false);
  });

  it('refuses a name longer than 80 characters', () => {
    expect(ExpenseSubcategoryName.create('a'.repeat(81)).ok).toBe(false);
    expect(ExpenseSubcategoryName.create('a'.repeat(80)).ok).toBe(true);
  });

  it('compares two names by value', () => {
    const one = ExpenseSubcategoryName.create('Groceries');
    const same = ExpenseSubcategoryName.create(' Groceries ');
    const other = ExpenseSubcategoryName.create('Bakery');

    expect(one.ok && same.ok && one.value.equals(same.value)).toBe(true);
    expect(one.ok && other.ok && one.value.equals(other.value)).toBe(false);
  });
});