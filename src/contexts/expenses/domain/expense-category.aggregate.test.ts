import { describe, expect, it } from 'vitest';
import { Email } from './email.value-object';
import { ExpenseCategory } from './expense-category.aggregate';
import { categoryTarget, subcategoryTarget } from './expense-target.value-object';

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

  it('starts without expense-subcategories', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);

    expect(category.ok && category.value.subcategories).toEqual([]);
    expect(category.ok && category.value.hasSubcategories()).toBe(false);
  });

  it('adds an expense-subcategory', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');

    const added = category.value.addSubcategory({ id: 'subcategory-1', name: 'Groceries' });

    expect(added.ok).toBe(true);
    expect(added.ok && added.value.name.value).toBe('Groceries');
    expect(category.value.subcategories.map((subcategory) => subcategory.name.value)).toEqual(['Groceries']);
    expect(category.value.hasSubcategories()).toBe(true);
  });

  it('refuses a subcategory name another subcategory of the same category already uses', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');
    if (!category.value.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');

    const added = category.value.addSubcategory({ id: 'subcategory-2', name: ' Groceries ' });

    expect(added.ok).toBe(false);
    expect(!added.ok && added.error.kind).toBe('SubcategoryNameAlreadyExists');
    expect(category.value.subcategories).toHaveLength(1);
  });

  it('refuses a subcategory without a usable name', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');

    const added = category.value.addSubcategory({ id: 'subcategory-1', name: ' ' });

    expect(added.ok).toBe(false);
    expect(!added.ok && added.error.kind).toBe('InvalidSubcategoryName');
    expect(category.value.subcategories).toEqual([]);
  });

  it('allows the same subcategory name under a different category', () => {
    const food = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    const transport = ExpenseCategory.create({ id: 'category-2', name: 'Transport', ownerEmail: owner }, now);
    if (!food.ok || !transport.ok) throw new Error('fixtures must be valid');
    if (!food.value.addSubcategory({ id: 'subcategory-1', name: 'Monthly' }).ok) throw new Error('fixture');

    const added = transport.value.addSubcategory({ id: 'subcategory-2', name: 'Monthly' });

    expect(added.ok).toBe(true);
    expect(food.value.subcategories).toHaveLength(1);
    expect(transport.value.subcategories).toHaveLength(1);
  });

  it('renames an expense-subcategory', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');
    if (!category.value.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');

    const renamed = category.value.renameSubcategory('subcategory-1', 'Fresh food');

    expect(renamed.ok).toBe(true);
    expect(category.value.subcategories[0]?.name.value).toBe('Fresh food');
  });

  it('refuses to rename an expense-subcategory to a name another one already uses', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');
    if (!category.value.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');
    if (!category.value.addSubcategory({ id: 'subcategory-2', name: 'Bakery' }).ok) throw new Error('fixture');

    const renamed = category.value.renameSubcategory('subcategory-2', 'Groceries');

    expect(renamed.ok).toBe(false);
    expect(!renamed.ok && renamed.error.kind).toBe('SubcategoryNameAlreadyExists');
    expect(category.value.subcategories.map((subcategory) => subcategory.name.value)).toEqual([
      'Groceries',
      'Bakery',
    ]);
  });

  it('refuses to rename an expense-subcategory that does not exist', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');

    const renamed = category.value.renameSubcategory('missing', 'Groceries');

    expect(renamed.ok).toBe(false);
    expect(!renamed.ok && renamed.error.kind).toBe('ExpenseSubcategoryNotFound');
  });

  it('removes an expense-subcategory', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');
    if (!category.value.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');

    const removed = category.value.removeSubcategory('subcategory-1');

    expect(removed.ok).toBe(true);
    expect(category.value.subcategories).toEqual([]);
  });

  it('accepts a category without expense-subcategories as the target of an expense', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');

    const allowed = category.value.validateTarget(categoryTarget('category-1'));

    expect(allowed.ok).toBe(true);
  });

  it('refuses a category that still has expense-subcategories as the target of an expense', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');
    if (!category.value.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');

    const allowed = category.value.validateTarget(categoryTarget('category-1'));

    expect(allowed.ok).toBe(false);
    expect(!allowed.ok && allowed.error.kind).toBe('ExpenseCategoryHasSubcategories');
  });

  it('accepts one of its own expense-subcategories as the target of an expense', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');
    if (!category.value.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');

    const allowed = category.value.validateTarget(subcategoryTarget('category-1', 'subcategory-1'));

    expect(allowed.ok).toBe(true);
  });

  it('refuses an expense-subcategory that the category does not have', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');
    if (!category.value.addSubcategory({ id: 'subcategory-1', name: 'Groceries' }).ok) throw new Error('fixture');

    const allowed = category.value.validateTarget(subcategoryTarget('category-1', 'missing'));

    expect(allowed.ok).toBe(false);
    expect(!allowed.ok && allowed.error.kind).toBe('ExpenseSubcategoryNotFound');
  });

  it('refuses to remove an expense-subcategory that does not exist', () => {
    const category = ExpenseCategory.create({ id: 'category-1', name: 'Food', ownerEmail: owner }, now);
    if (!category.ok) throw new Error('fixture must be valid');

    const removed = category.value.removeSubcategory('missing');

    expect(removed.ok).toBe(false);
    expect(!removed.ok && removed.error.kind).toBe('ExpenseSubcategoryNotFound');
  });
});