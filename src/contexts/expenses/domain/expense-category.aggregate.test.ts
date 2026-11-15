import { describe, expect, it } from 'vitest';
import { Email } from './email.value-object';
import { ExpenseCategory } from './expense-category.aggregate';

const owner = Email.reconstitute('ada@example.com');
const now = new Date('2026-01-01T00:00:00Z');

describe('ExpenseCategory', () => {
  it('creates a category owned by the requesting user', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);

    expect(category.ok).toBe(true);
    expect(category.ok && category.value.toSnapshot()).toMatchObject({
      id: 'category-1',
      createdAt: now,
    });
    expect(category.ok && category.value.name.value).toBe('Food');
    expect(category.ok && category.value.ownerEmail.equals(owner)).toBe(true);
  });

  it('refuses a category without a usable name', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: '  ', ownerEmail: owner }, now);

    expect(category.ok).toBe(false);
    expect(!category.ok && category.error.kind).toBe('InvalidCategoryName');
  });

  it('renames a category', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');

    const renamed = category.value.rename('Groceries');

    expect(renamed.ok).toBe(true);
    expect(category.value.name.value).toBe('Groceries');
  });

  it('refuses to rename a category to an unusable name and keeps the old one', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');

    const renamed = category.value.rename('   ');

    expect(renamed.ok).toBe(false);
    expect(!renamed.ok && renamed.error.kind).toBe('InvalidCategoryName');
    expect(category.value.name.value).toBe('Food');
  });
});