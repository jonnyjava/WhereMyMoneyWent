import { describe, expect, it } from 'vitest';
import { ExpenseSubcategory } from './expense-subcategory.entity';

describe('ExpenseSubcategory', () => {
  it('creates a subcategory with a usable name', () => {
    const subcategory = ExpenseSubcategory.create({ id: 'subcategory-1', name: ' Groceries ' });

    expect(subcategory.ok).toBe(true);
    expect(subcategory.ok && subcategory.value.name.value).toBe('Groceries');
    expect(subcategory.ok && subcategory.value.id).toBe('subcategory-1');
  });

  it('refuses a subcategory without a usable name', () => {
    expect(ExpenseSubcategory.create({ id: 'subcategory-1', name: '  ' }).ok).toBe(false);
    expect(ExpenseSubcategory.create({ id: 'subcategory-1', name: 'a'.repeat(81) }).ok).toBe(false);
  });

  it('renames to a copy, leaving the original untouched', () => {
    const subcategory = ExpenseSubcategory.create({ id: 'subcategory-1', name: 'Groceries' });
    if (!subcategory.ok) throw new Error('fixture must be valid');

    const renamed = subcategory.value.rename('Fresh food');

    expect(renamed.ok && renamed.value.name.value).toBe('Fresh food');
    expect(subcategory.value.name.value).toBe('Groceries');
  });

  it('refuses a rename to an unusable name', () => {
    const subcategory = ExpenseSubcategory.create({ id: 'subcategory-1', name: 'Groceries' });
    if (!subcategory.ok) throw new Error('fixture must be valid');

    const renamed = subcategory.value.rename(' ');

    expect(renamed.ok).toBe(false);
    expect(!renamed.ok && renamed.error.kind).toBe('InvalidSubcategoryName');
  });
});